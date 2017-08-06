var express = require("express");
var fs = require("fs");
var app = express();
var parseStringXml = require("xml2js").parseString;
var urijs = require("urijs");
var http = require("http");
var https = require("https");
var Promise = require("bluebird");
var mongoose = require("mongoose");
var Audiosearch = require("audiosearch-client-node");
var Podcast = require("./models/db-models/podcast"), //Database model for podcast
  Tag = require("./models/db-models/tag").Tag, //Database model for tag
  Tags = require("./models/db-models/tag").Tags,
  PodCategories = require("./models/db-models/categories.js"), //Database model for categories
  Host = require("./models/db-models/host.js"), //Database model for podcast hosts.
  Episode = require("./models/db-models/episode.js"),
  // ItunesPodcastUpdater = require('./services/itunes_updater_service.js'),
  Itunes = require("./models/ext-models/itunes_podcast.js"), // External model for itunes podcast format
  ItunesQueryParams = require("./models/ext-models/itunes_query_params.js"), //Eternal model for use when querying the Itunes API
  BasePodcast = require("./models/ext-models/base_pod.js"); //Base podcast model for the inital podcast names that have acquired.

//var mp3Duration = require("mp3-duration");
const request = require("request-promise");

var AUDIOSEARCH_APP_ID =
  "d4dad46362e5e54ee74ef0cc027f72a05e81e8cc39529661115e7e78d0998414";
var AUDIOSEARCH_SECRET =
  "42aecc8fe642e535e01861e40e38a45e8f97ae616b6c6883a9cafe8bb4f3b80f";
var audiosearch = new Audiosearch(AUDIOSEARCH_APP_ID, AUDIOSEARCH_SECRET);

//Server start

const initializeDB = async () => {
  // Connection URL to the podcast database
  var localurl = "mongodb://localhost:27017/podcasts";
  var mlabUrl =
    "mongodb://admin:thisiscs50@ds129143.mlab.com:29143/dev-podcasts";
  var options = {
    server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }
  };

  mongoose.Promise = Promise; //Set the promise object for mongoose.
  mongoose.connect(mlabUrl, options); //Connect to the running mongoDB instance
  var conn = mongoose.connection;

  conn.on("error", console.error.bind(console, "connection error:"));

  await conn.once("open", function() {
    console.log("MongoDB connection established!");
  });

/*    
Episode.nextCount(function(err, count) {
  // count === 1 -> true
});

Tag.nextCount(function(err, count) {
    // count === 1 -> true
  });

Podcast.nextCount(function(err, count) {
  // count === 1 -> true
}); */
    
};

const initializeData = function() {

  String.prototype.toObjectId = function() {
    var ObjectId = require("mongoose").Types.ObjectId;
    return new ObjectId(this.toString());
  };

  // insertDefaultPodcastCategories(); //Method that updates the Categories collection/table with initial data if there is none.
  insertDefaultTags(); //Method that updates the Tags collection/table with initial data if there is none.
  // insertBasePodcastList(); //Method that updates the Base Podcast collection/table with initial data if there is none.
};

const insertDefaultPodcastCategories = function() {
  var cat = new PodCategories.CategoryType();
  cat.model("CategoryType").count(function(err, count) {
    if (count <= 0) {
      for (var i = 0; i < PodCategories.CategoryTypes.length; i++) {
        var categoryType = new PodCategories.CategoryType({
          name: PodCategories.CategoryTypes[i].name,
          code: PodCategories.CategoryTypes[i].code
        });

        categoryType.save(function(err) {
          console.log("Cateogory: " + categoryType.name + " was added!");
        });
      }
    }
    return;
  });
};

const insertDefaultTags = function() {
  Tag.count({}, async (err, count) => {
    if (count <= 0) {
      for (var i = 0; i < Tags.length; i++) {
        var exists = await Tag.findOne({
          description: Tags[i].description.toString()
        }).exec();
        if (!exists) {
          var tagRecord = new Tag({
            description: Tags[i].description
          });
        }
        tagRecord.save(function(err) {
          // console.log("Tag: " + tagRecord.description + " was added!");
        });
      }
    }
    return;
  }).catch(err => {
    console.log(err);
  });
};

initializeDB();
initializeData();

const getRSSDataForPodcasts = function() {
  var podcastList = Podcast.getAllPodcasts()
    .then(async pods => {
      if (pods != null && pods.length > 0) {
        var interval = 10 * 200;
        for (var i = 0; i < pods.length; i++) {
          setTimeout(
            async function(i) {
              var podcast = pods[i];
              var rsslink = podcast.feed_url;
              await getEpisodeData(rsslink, podcast);
            },
            interval * i,
            i
          );
        }
      }
    })
    .catch(err => {
      console.log(err);
    });
};

const updatePodcastData = async function() {
  //Get all itunes ids
  BasePodcast.getAllItunesIds().then(async function(result) {
    if (result != null && result.length > 0) {
      var listofIds = result;
      for (var i = 0; i < listofIds.length; i++) {
        var itunes_id = listofIds[i];
        await buildItunesQueryUrl(itunes_id);
      }
    }
  });
};

//updatePodcastData();
getRSSDataForPodcasts();

const buildItunesQueryUrl = async function(id) {
  var url = "https://itunes.apple.com/lookup/" + id;
  const options = {
    method: "GET",
    url: url,
    json: true
  };
  request(options)
    .then(async function(response) {
      if (response != null && response.resultCount > 0) {
        var responsePod = response.results[0];
        var exists = await Podcast.findOne({
          show_title: responsePod.trackName.toString()
        }).exec();
        if (!exists) {
          var podcast = new Podcast();

          var currentdate = new Date(Date.now()).toLocaleString();
          podcast.created_date = currentdate;
          podcast.show_title = responsePod.trackName;
          podcast.img_url = responsePod.artworkUrl100;
          podcast.feed_url = responsePod.feedUrl;
          podcast.episode_count = responsePod.trackCount;
          podcast.country = responsePod.country;
          await BasePodcast.findOne({ title: responsePod.trackName })
            .select("podcast_site category")
            .exec(function(err, basepod) {
              if (basepod != null) {
                podcast.show_url = basepod._doc.podcast_site;
                podcast.category = basepod._doc.category;
              }
            });

          var genres = responsePod.genres;
          var listOfTags = await queryOrInsertTags(genres, podcast);

          podcast.tags = listOfTags;

          podcast.artists = responsePod.artistName;
          //TODO: Need to clean up some of the host names coming out Itunes.
          /*  var host = new Host();
          host.name = responsePod.artistName;
           host.associated_podcast = podcast; */

          /* host.save(function(err) {
            if (err) throw err;
          }); */
          // console.log(host.name);

          var date = Date.parse(responsePod.releaseDate);
          if (isNaN(date) == false) {
            var d = new Date(responsePod.releaseDate);
            podcast.pod_release_date = d;
          } else {
            date = null;
          }

          //podcast.host = host;

          podcast.save(function(err) {
            if (err) throw err;
            // console.log("Podcast: " + podcast.show_title + " saved!");
          });
        }
      }
    })
    .catch(function(err) {
      console.log(err);
    });
};

const queryOrHost = async function(host) {};

const queryOrInsertTags = async function(genres, podcast) {
  var tags = new Array();
  var tag = null;
  if (genres.length > 0) {
    for (var i = 0; i < genres.length; i++) {
      var genre = genres[i].toString();
      if(genre != null && genre != ""){
            var doc = await Tag.findOne({ description: genre }).exec();
      if (doc == null || doc._doc == null) {
        tag = new Tag();
        tag.description = genres[i];
      } else {
        tag = doc;
      }

      if(tag == null) {
        console.log(tag + podcast);
      }
      tag._doc.associated_podcasts.push(podcast);
      tag.save(function(err) {
        if (err) throw err;
        tags.push(tag);
      });
      }
  
    }
  }
  return tags;
};

const getEpisodeData = async function(rsslink, podcast) {
  console.log(podcast.show_title);
  var episodes = new Array();
  if (rsslink != null && rsslink != "") {
    await queryUrl(rsslink)
      .then(res => {
        parseStringXml(res, async function(err, result) {
          if (result != null && result != undefined) {
            var channel = result.rss.channel[0];
            if (channel != null && channel != undefined) {
              if (channel.hasOwnProperty("item")) {
                var episodelist = channel.item;
                for (var i = 0; i < episodelist.length; i++) {
                  var ep = episodelist[i];
                  try {
                    var existingEp = await Episode.findOne({
                      title: ep.title[0]
                    }).exec();
                    if (!existingEp) {
                      var episode = new Episode();
                      var currentdate = new Date(Date.now()).toLocaleString();
                      episode.created_date = currentdate;
                      episode.title = ep.title[0];

                      if (ep.enclosure == undefined) {
                        episode.audio_url = null;
                        episode.audio_type = null;
                        episode.file_size = null;
                      } else {
                        var audio_stream_object = ep.enclosure[0].$;
                        episode.audio_url = audio_stream_object.url;
                        episode.audio_type = audio_stream_object.type;
                      }

                      if (ep.link == undefined) {
                        episode.source_url = null;
                      } else {
                        episode.source_url = ep.link[0];
                      }

                      episode.published_date = ep.pubDate[0];
                      // episode.created_date
                      episode.image_url = null; // ep["itunes:image"][0].length > 0 ? ep["itunes:image"][0].$.href : null;

                      episode.show = podcast;

                      if (ep.hasOwnProperty("itunes:author")) {
                        episode.author = ep["itunes:author"][0];
                      } else if (ep.hasOwnProperty("author")) {
                        episode.author = ep.author[0];
                      } else {
                        episode.author = null;
                      }

                      if (ep.hasOwnProperty("itunes:summary")) {
                        episode.description = ep["itunes:summary"][0];
                      } else if (ep.hasOwnProperty("desription")) {
                        episode.description = ep.description[0];
                      } else {
                        episode.description = null;
                      }

                      if (
                        ep.hasOwnProperty("itunes:duration") &&
                        episode.duration != null
                      ) {
                        var dur = ep["itunes:duration"][0].toString();
                        episode.audio_duration = dur.contains(":") ? null : dur;
                      } else {
                        episode.audio_duration = null;
                      }

                      if (ep.hasOwnProperty("itunes:keywords")) {
                        episode.tags = await parseTagsInString(
                          ep["itunes:keywords"][0],
                          episode
                        );
                      } else if (ep.hasOwnProperty("category")) {
                        episode.tags = await parseTagsInString(
                          ep.category[0],
                          episode
                        );
                      } else {
                        episode.tags = null;
                      }

                      //episodes.push(episode);
                      episode.save(function(err) {
                        if (err) throw err;
                        //console.log("Saved episode!");
                      });
                    }
                  } catch (err) {
                    console.log(podcast.show_title + " threw and exception!");
                    console.log(err);
                  }
                }
              }
            }
          }
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
};

const parseTagsInString = async function(tagString, episode) {
  var listOfTags = new Array();
  tagString = tagString.toString();
  if (tagString != null && tagString != "") {
    var tags = tagString.split(",");
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      var newTag = null;
      //var alreadyAssociated = false;
      var doc = await Tag.findOne({ description: tag }).exec();
      if (doc != null && doc._doc != null) {
        newTag = doc;
      } else {
        newTag = new Tag();
        newTag.description = tag;
      }

      newTag._doc.associated_episodes.push(episode);

      newTag.save(function(err) {
        if (err) {
          throw err;
        }
      });
      listOfTags.push(newTag);
    }
  }
  return listOfTags.length <= 0 ? null : listOfTags;
};

//These two methods should go to web_requests.js
const queryUrl = async function(url) {
  const options = { method: "GET", url: url, json: true };
  return request(options)
    .then(res => {
      return res;
    })
    .catch(err => {
      console.log(err);
    });
};

const downloadUrl = async function(url, dest, cb) {
  if (fs.exists(dest)) {
    fs.unlinkSync(dest);
  }
  var file = fs.createWriteStream(dest);

  var sendReq = request.get(url);

  sendReq.on("response", function(response) {
    if (response.statusCode !== 200) {
      return cb("Status code was " + response.statusCode);
    }
  });

  sendReq.on("error", function(err) {
    fs.unlink(dest);
    return cb(err.message);
  });

  sendReq.pipe(file);

  file.on("finish", function() {
    file.close(cb);
  });

  file.on("error", function(err) {
    // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    return cb(err.message);
  });

  return file;
};

/******** Begin section for handling server requests**************** */

var server = app.listen(9000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);
});

//Get all podcasts
app.get("/api/podcasts", function(req, res) {
  //Main page
  Podcast.getAllPodcasts()
    .then(result => {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
});

//Get recent podcasts the limit is set by the requestor;
app.get("/api/podcasts/recents/:limit", function(req, res) {
  //Recents
  var limitTo = parseInt(req.params.limit);
  if (limitTo == null || limitTo == undefined) {
    limitTo = 15;
  }
  Podcast.getRecentPodcasts(limitTo)
    .then(result => {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
});

//Get recent podcasts default is last 15;
app.get("/api/podcasts/recents", function(req, res) {
  //Recents
  var limitTo = 15;
  Podcast.getRecentPodcasts(limitTo)
    .then(result => {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
});



//Get all podcasts that contain the specified tag
app.get("/api/podcasts/tag/:tag", function(req, res) {
  var tag = req.params.tag;
  Podcast.getAllPodcastsByTag(tag)
    .then(result => {

      res.end(JSON.stringify(result));
    })
    .catch(err => {});
});
/* 
//All podcasts for a specific category
app.get("/api/podcasts/category/:type", function(req, res) {
  var cat = req.params.type;
  Podcast.getPodcastsByCategory(cat)
    .then(function(result) {
      res.end(JSON.stringify(result));
    })
    .catch(err => {});
}); */

/* //Get all podcast categories.
app.get("/api/category", function(req, res) {
  CategoryType.getAllCategories()
    .then(function(result) {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
}); */

/* //Get the podcast with the specified ID
app.get("/api/podcasts/:id", function(req, res) {
  var id = req.params.id;
  Podcast.getPodcastByID(id)
    .then(function(result) {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
}); */

/* //Get podcasts that matched the given string
app.get("/api/podcasts/search/:name", function(req, res) {
  var name = req.params.name;
  Podcast.getPodcastsByName(name)
    .then(function(result) {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
}); */



//Get all episodes
/* app.get("/api/episodes", function(req, res) {
  //Main page
  Podcast.getAllEpisodes()
    .then(result => {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
}); */

//Get the episode with the specified ID
app.get("/api/episodes/:id", function(req, res) {
  var id = req.params.id;
  Episode.getEpisodesByID(id)
    .then(function(result) {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
});

//Get all episodes for the specified podcast
app.get("/api/podcasts/episodes/:show_id", function(req, res) {
  //Main page
  var id = req.params.show_id;
  Episode.getAllEpisodes(id)
    .then(result => {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
});

//Get recent podcasts default is last 15;
app.get("/api/podcasts/episodes/recents/:show_id/", function(req, res) {
  //Recents
  var limitTo = 15;
  var show_id = req.params.show_id;
  Episode.getRecentEpisodes(show_id,limitTo)
    .then(result => {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
});


//Get recent podcasts the limit is set by the requestor;
app.get("/api/podcasts/episodes/recents/:show_id/:limit", function(req, res) {
  //Recents
  var show_id = req.params.show_id;
  var limitTo = parseInt(req.params.limit);
  if (limitTo == null || limitTo == undefined) {
    limitTo = 15;
  }
  Episode.getRecentEpisodes(show_id, limitTo)
    .then(result => {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
});
/* 
app.get("/api/podcast/episodes/tag/:tag", function(req, res) {
  var tag = req.params.tag;
  Episode.getAllEpisodesByTag(tag)
    .then(function(result) {
      res.end(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
});
 */