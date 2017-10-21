//var express = require("express");
var ExpressInitializer = require('./app.js');
var fs = require("fs");
//var app = require('./app/app.js');// express();
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
var logger  = require('./lib/log.js');



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
  var localurl = "mongodb://localhost:27017/dev-podcasts";
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
//   await ItunesPodcastUpdater.resetIdentities();
//  await ItunesPodcastUpdater.updateData();
   // await ItunesPodcastUpdater.updatePodcastReleaseDates();
  // await ItunesEpisodeUpdater.updateData();

    setInterval(function(){
      ItunesPodcastUpdater.updatePodcastReleaseDates();
   },600000); 

   setInterval(function(){
    ItunesEpisodeUpdater.updateData();
   },900000); 
 
   setInterval(function(){
 ItunesPodcastUpdater.populateEpisodeSubDocuments();
   }, 1200000)
   

  });
 

};

const initializeData = function() {

  String.prototype.toObjectId = function() {
    var ObjectId = require("mongoose").Types.ObjectId;
    return new ObjectId(this.toString());
  };

  // insertDefaultPodcastCategories(); //Method that updates the Categories collection/table with initial data if there is none.
  //insertDefaultTags(); //Method that updates the Tags collection/table with initial data if there is none.
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

ExpressInitializer.startApp();


