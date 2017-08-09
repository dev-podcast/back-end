"use strict";
const db_models = require("../models/db-models");
const ext_models = require("../models/ext-models");
const request = require("request-promise");
const BasePodcast = ext_models.basepod;
const Podcast = db_models.podcast;
const Host = db_models.host;

const base_lookup_url = "https://itunes.apple.com/lookup/";
const options = {
  method: "GET",
  url: base_lookup_url,
  json: true
};

const buildItunesQuery = async function(id) {
  var url = base_lookup_url + id;
  options.url = url;
  return options;
};

const buildPodcastData = async function(options) {
  request(options)
    .then(async response => {
      if (response != null && response.resultCount > 0) {
        var responsePod = response.results[0];
        var exists = awaitPodcast
          .findOne({
            show_title: responsePod.trackName.toString()
          })
          .exec();
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
    .catch(err => {
      if (err) throw err;
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
        listOfIds.forEach(async itunesid => {
          var options  = await buildItunesQuery(itunesid);
          await buildPodcastData(options);
        });
      }
    });
  }

  static updatePodcastReleaseDates() {
    // await getItunesIds();
  }
}

module.exports = ItunesPodcastUpdater;
