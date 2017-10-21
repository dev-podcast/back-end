var express = require('express');
var app = express();
var db_models = require("./models/db-models");
var CategoryType = db_models.categorytype;
var CategoryTypes = db_models.categorytypes;
var Episode = db_models.episode;
var Host = db_models.host; 
var Podcast = db_models.podcast;
var Tag = db_models.tag; 
var Tags = db_models.tags;
var logger = require("winston");   


var server = null;
var host = null;
var port = null;
const DEFAULT_PORT = 8082;

class ExpressInitializer {
  constructor() { }

  static startApp() {
    server = app.listen(DEFAULT_PORT, () => {
      host = server.address().address;
      port = server.address().port;
    });


    app.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
      next();
    });


    //Get all podcasts
    app.get("/api/podcasts", function (req, res) {
      //Main page
      Podcast
        .getAllPodcasts()
        .then(result => {
          res.end(JSON.stringify(result));
        })
        .catch(err => {
          logger.log("error", err);
          console.log(err);
        });
    });

    //Get recent podcasts the limit is set by the requestor;
    app.get("/api/podcasts/recents/:limit", function (req, res) {
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
          logger.log("error", err);
          console.log(err);
        });
    });

    //Get recent podcasts default is last 15;
    app.get("/api/podcasts/recents", function (req, res) {
      //Recents
      var limitTo = 15;
      Podcast
        .getRecentPodcasts(limitTo)
        .then(result => {
          res.end(JSON.stringify(result));
        })
        .catch(err => {
          logger.log("error", err);
          console.log(err);
        });
    });



    //Get all podcasts that contain the specified tag
    app.get("/api/podcasts/tag/:tag_id", function (req, res) {
      var tag_id = req.params.tag_id;
      Podcast
        .getAllPodcastsByTag(tag_id)
        .then(result => {
          res.end(JSON.stringify(result));
        })
        .catch(err => {
          logger.log("error", err);
        });
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

    //Get the podcast with the specified ID
    app.get("/api/podcasts/:id", function (req, res) {
      var id = req.params.id;
      Podcast.getPodcastByID(id)
        .then(function (result) {
          res.end(JSON.stringify(result));
        })
        .catch(err => {
          logger.log("error", err);
          console.log(err);
        });
    });

    //Get podcasts that matched the given string
    app.get("/api/podcasts/search/:name", function (req, res) {
      var name = req.params.name;
      Podcast.searchPodcastsByTitle(name)
        .then(function (result) {
          res.end(JSON.stringify(result));
        })
        .catch(err => {
          logger.log("error", err);
          console.log(err);
        });
    });



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
    app.get("/api/episodes/:id", function (req, res) {
      var id = req.params.id;
      Episode
        .getEpisodesByID(id)
        .then(function (result) {
          res.end(JSON.stringify(result));
        })
        .catch(err => {
          logger.log("error", err);
          console.log(err);
        });
    });

    //Get all episodes for the specified podcast
    app.get("/api/podcasts/episodes/:show_id", function (req, res) {
      //Main page
      var show_id = req.params.show_id;

      Episode.getAllEpisodes(show_id)
        .then(result => {
          res.end(JSON.stringify(result));
        })
        .catch(err => {
          logger.log("error", err);
          console.log(err);
        });
    });



    //Get recent podcasts default is last 15;
    app.get("/api/podcasts/episodes/recents/:show_id", function (req, res) {
      //Recents
      var limitTo = 15;
      var show_id = req.params.show_id;
      Episode
        .getRecentEpisodes(show_id, limitTo)
        .then(result => {
          res.end(JSON.stringify(result));
        })
        .catch(err => {
          logger.log("error", err);
          console.log(err);
        });
    });


    //Get recent podcasts the limit is set by the requestor;
    app.get("/api/podcasts/episodes/recents/:show_id/:limit", function (req, res) {
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
          logger.log("error", err);
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


  }
}



module.exports = ExpressInitializer;