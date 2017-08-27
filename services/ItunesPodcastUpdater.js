"use strict";
const db_models = require("../models/db-models");
const ext_models = require("../models/ext-models");
const request = require("request-promise");
const BasePodcast = ext_models.basepod;
const Podcast = db_models.podcast;
const Host = db_models.host;
const Episode = db_models.episode;
const Tag = db_models.tag;

const base_lookup_url = "https://itunes.apple.com/lookup/";

const buildItunesQuery = function(id) {
  var url = base_lookup_url + id;
  var options = {
    method: "GET",
    url: url,
    json: true
  };
  return options;
};

const getLatestEpisodeDate = async options => {
  request(options).then(async response => {
    if (response != null && response.resultCount > 0) {
      var responsePod = response.results[0];
      var exists = await Podcast.findOne({
        show_title: responsePod.trackName.toString()
      }).exec();
      if (exists) {
        var podcast = exists;
        var date = Date.parse(responsePod.releaseDate);
        if (isNaN(date) == false) {
          var d = new Date(responsePod.releaseDate);
          if (d.getTime() !== podcast._doc.pod_release_date.getTime()) {
            podcast._doc.pod_release_date = d;
          }
        }
      }
    }
  });
};

const createPodcast = async function(response) {
  var responsePod = response.results[0];
  var query = Podcast.findOne({
    show_title: responsePod.trackName.toString()
  });
  var promise = query.exec();
  return promise
    .then(async podcast => {
      if (podcast == null) {
        var podcast = new Podcast();

        var currentdate = new Date(Date.now()).toLocaleString();
        podcast.created_date = currentdate;
        podcast.show_title = responsePod.trackName;
        podcast.image_url = responsePod.artworkUrl600;
        podcast.feed_url = responsePod.feedUrl;
        podcast.episode_count = responsePod.trackCount;
        podcast.country = responsePod.country;
        podcast.artists = responsePod.artistName;
        var date = Date.parse(responsePod.releaseDate);
        if (isNaN(date) == false) {
          var d = new Date(responsePod.releaseDate);
          podcast.pod_release_date = d;
        }

  
       
        if (responsePod.trackName == "Microsoft Azure Cloud Cover Show (HD) - Channel 9") {
           console.log(responsePod.trackName);
        }
          
          return setCategoryAndPodcastUrl(responsePod.trackName, podcast)
            .then(function(pod) {
              if(pod != null) {

              var genres = responsePod.genres;
              console.log(responsePod.trackName);
              //await queryOrInsertTags(genres, podcast);
              return pod
                .save()
                .then(function(savePod) {
                  var data = { tags: genres, podcast: savePod };
                  return data;
                })
                .catch(function(err) {
                  if (err) throw err;
                });
              }
            })
            .catch(err => {
              if (err) throw err;
            });

        /*   await BasePodcast.findOne({ title: responsePod.trackName })
          .select("podcast_site category")
          .exec(function(err, basepod) {
            if (basepod != null) {
              podcast.show_url = basepod._doc.podcast_site;
              podcast.category = basepod._doc.category;
            }
          }); */
      }
    })
    .then(async data => {
      //success
      if (data != null) {
        await buildTagsForPodcast(data);
        // return podcast;
      }
    })
    .catch(function(err) {
      console.log(err);
    });
};

const buildTagsForPodcast = function(data) {
  if (data != null) {
    var podcast = data.podcast;
    var itunesTags = data.tags;
    var promises = [];
    var x = 0;

    var processTags = function(x) {
      if( x < itunesTags.length){
       createTag(podcast, itunesTags[x]).then(function(tag){
           podcast._doc.tags.push(tag);
           return podcast.save().then(function(resolved) {
             processTags(x + 1);
              return resolved;
           }).catch(err => {
                console.log(err);
           });       
       });

        
      }
    }

    processTags(x);
  }
};

const createTag = function(podcast, itunestag) {
  // console.log("Podcast: " + podcast._doc.show_title);
  // console.log("Tag to insert: " + itunestag);
  var promise = Tag.findOne({ description: itunestag });
  return promise.then(function(tag) {
    if (tag == null) {
      tag = new Tag();
      tag.description = itunestag;
    }
    tag._doc.associated_podcasts.push(podcast);
    return tag
      .save()
      .then(function(tag) {
        return tag;
      })
      .catch(function(err) {
        return err;
      });
  });
};

const setCategoryAndPodcastUrl = function(trackname, podcast) {
  var promise = BasePodcast.findOne({title: trackname}).select("podcast_site category");
  return promise.then(function(basepod) {
    var name = trackname;
      if(basepod) {
           podcast.show_url = basepod._doc.podcast_site;
           podcast.category = basepod._doc.category;
           return podcast;
      } else {
        return null;
      }
  }).catch(err => {
      throw err;
  });
};

const buildPodcastData = async function(options) {
  var promiseRequest = request(options);

  return promiseRequest.then(async response => {
    if (response != null && response.resultCount > 0) {
      await createPodcast(response);
    }
  });
};

const queryOrInsertTags = async function(genres, podcast) {
  var tags = new Array();

  if (genres.length > 0) {
    for (var genre of genres) {
      if (genre != null && genre != "") {
        var query = Tag.findOne({
          description: genre.toString()
        });
        var promise = query.exec();

        await promise.then(doc => {
          try {
            if (doc == null) {
              var tag = new Tag();
              tag.description = genre;
              tag._doc.associated_podcasts.push(podcast);
              tag.save(err => {
                if (err) {
                  console.log(doc);
                  console.log(genre);
                  console.log(err);
                }
              });
              podcast._doc.tags.push(tag);
              podcast
                .save(err => {
                  if (err) {
                    console.log(err);
                  }
                })
                .catch(err => {});
            } else {
              tag = doc;
              tag._doc.associated_podcasts.push(podcast);
              tag.save(err => {
                if (err) {
                  console.log(err);
                }
              });
              podcast._doc.tags.push(tag);
              podcast
                .save(err => {
                  if (err) {
                    console.log(err);
                  }
                })
                .catch(err => {});
            }
          } catch (err) {
            console.log(err);
          }
        });
      }
    }
  }
};

var x = 0;

const iterationMethod = async function(x, arr) {

  var itunesid = arr[x];
  
  var options = await buildItunesQuery(itunesid);
  await buildPodcastData(options).then(function(podcast) {
    if (podcast != null) {
     // console.log("Checking out podcast no: " + i);
      console.log(podcast);
      podcasts.push(podcast);
    }
  });

  x++;
  
  if(x < arr.length){
    iterationMethod(x, arr);
  }

}

class ItunesPodcastUpdater {
  constructor() {}

  static updateData() {
    var podcasts = [];
    BasePodcast.getAllItunesIds()
      .then(async result => {
       if (result != null && result.length > 0) {     
           iterationMethod(x, result);
       }
      })
      .catch(err => {
        console.log(err);
      });
  }

  static updatePodcastReleaseDates() {
    BasePodcast.getAllItunesIds()
      .then(result => {
        if (result != null && result.length > 0) {
          var listOfIds = result;
          var count = 1;
          listOfIds.forEach(async itunesid => {
            var options = await buildItunesQuery(itunesid);
            await getLatestEpisodeDate(options);
            count++;
            console.log("Updated " + count + " podcasts so far.");
          });
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  static resetIdentities() {
    Episode.resetCount(function(err, count) {
      // count === 1 -> true
    });

    Tag.resetCount(function(err, count) {
      // count === 1 -> true
    });

    Podcast.resetCount(function(err, count) {
      // count === 1 -> true
    });
  }
}

module.exports = ItunesPodcastUpdater;
