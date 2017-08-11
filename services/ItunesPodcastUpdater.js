"use strict";
const db_models = require("../models/db-models");
const ext_models = require("../models/ext-models");
const request = require("request-promise");
const BasePodcast = ext_models.basepod;
const Podcast = db_models.podcast;
const Host = db_models.host;
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

const getLatestEpisodeDate = async (options) => {
  request(options).then(async (response) =>{
      if(response != null && response.resultCount > 0){
         var responsePod = response.results[0];
         var exists = await Podcast
          .findOne({
            show_title: responsePod.trackName.toString()
          })
          .exec();
        if (exists) {
            var podcast = exists;       
            var date = Date.parse(responsePod.releaseDate);
            if (isNaN(date) == false) {
              var d = new Date(responsePod.releaseDate);
              if(d.getTime() !== podcast._doc.pod_release_date.getTime()){
                  podcast._doc.pod_release_date = d;
              }           
            } 
        }
      }
  });
};

const buildPodcastData = async function(options) {
  request(options)
    .then(async response => {
      if (response != null && response.resultCount > 0) {
        var responsePod = response.results[0];
        var exists = await Podcast
          .findOne({
            show_title: responsePod.trackName.toString()
          })
          .exec();
        if (!exists) {
          var podcast = new Podcast();

          var currentdate = new Date(Date.now()).toLocaleString();
          podcast.created_date = currentdate;
          podcast.show_title = responsePod.trackName;
          podcast.image_url = responsePod.artworkUrl600;
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
          }

          //podcast.host = host;

          podcast.save(function(err) {
            if (err) throw err;
             console.log("Podcast: " + podcast.show_title + " saved!");
          });
        }
      }
    })
    .catch(err => {
      if (err) throw console.log(err);
    });
};

const queryOrInsertTags = async function(genres, podcast) {
  var tags = new Array();
  var tag = null;
  if (genres.length > 0) {
    for (var i = 0; i < genres.length; i++) {
      var genre = genres[i].toString();
      if (genre != null && genre != "") {
        var doc = await Tag.findOne({ description: genre }).exec();
        if (doc == null || doc._doc == null) {
          tag = new Tag();
          tag.description = genres[i];
        } else {
          tag = doc;
        }

        if (tag == null) {
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

class ItunesPodcastUpdater {
  constructor() {}

  static updateData() {
    BasePodcast.getAllItunesIds().then(result => {
      if (result != null && result.length > 0) {
        var listOfIds = result;
        var count = 1;     
        listOfIds.forEach(async (itunesid) => {
          var options = await buildItunesQuery(itunesid);  
          await buildPodcastData(options);
          count++;
        });
      }
    }).catch((err)=>{
       console.log(err);
    });
  }

  static updatePodcastReleaseDates() {
    BasePodcast.getAllItunesIds()
      .then(result => {
        if (result != null && result.length > 0) {
          var listOfIds = result;
          var count = 1;
          listOfIds.forEach(async (itunesid) => {
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
}

module.exports = ItunesPodcastUpdater;
