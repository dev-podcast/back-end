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
var db_models = require("./models/db-models");
var CategoryType = db_models.categorytype;
var CategoryTypes = db_models.categorytypes;
var Episode = db_models.episode;
var Host = db_models.host; 
var Podcast = db_models.podcast;
var Tag = db_models.tag; 
var Tags = db_models.tags;
var request = require("request-promise"); 


var ext_models = require("./models/ext-models");
var BasePodcast = ext_models.basepod; 
var ItunesPodcast = ext_models.itunespodcast;
var ItunesQueryParams = ext_models.itunesqueryparams;

var ItunesPodcastUpdater = require('./services/ItunesPodcastUpdater');
var ItunesEpisodeUpdater = require('./services/ItunesEpisodeUpdater');


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

  await conn.once("open", async () => {
    console.log("MongoDB connection established!");
   // await ItunesPodcastUpdater.updateData();
   // await ItunesPodcastUpdater.updatePodcastReleaseDates();
   // await ItunesEpisodeUpdater.updateData();

  });
 
/*  Episode.resetCount(function(err, count) {
  // count === 1 -> true
});

Tag.resetCount(function(err, count) {
  // count === 1 -> true
});

Podcast.resetCount(function(err, count) {
  // count === 1 -> true
});   
    */ 
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
  var cat = new CategoryType();
  cat.model("CategoryType").count(function(err, count) {
    if (count <= 0) {
      for (var i = 0; i < CategoryTypes.length; i++) {
        var categoryType = new CategoryType({
          name: CategoryTypes[i].name,
          code: CategoryTypes[i].code
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
      for (var i = 0; i <  Tags.length; i++) {
        var exists = await   Tag.findOne({
          description:  Tags[i].description.toString()
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



/******** Begin section for handling server requests**************** */

var server = app.listen(9000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

//Get all podcasts
app.get("/api/podcasts", function(req, res) {
  //Main page
   Podcast
     .getAllPodcasts()
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
   Podcast
     .getRecentPodcasts(limitTo)
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
   Podcast
     .getRecentPodcasts(limitTo)
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
   Podcast
     .getAllPodcastsByTag(tag)
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
   Podcast.searchPodcastsByTitle(name)
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
   Episode
     .getEpisodesByID(id)
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
   Episode
     .getAllEpisodes(id)
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
   Episode
     .getRecentEpisodes(show_id, limitTo)
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
   Episode
     .getRecentEpisodes(show_id, limitTo)
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