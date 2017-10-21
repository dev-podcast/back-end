"use strict";
var logger = require("winston");   
const db_models = require("../models/db-models");
const request = require("request-promise");
const Episode = db_models.episode;
const Podcast = db_models.podcast;
const Tag = db_models.tag;
const parseStringXml = require("xml2js").parseString;

var x = 0;
var e = 0;

const iteratePodcasts = async function(x, arr) {
  var podcast = arr[x];
  await buildEpisodeData(podcast.feed_url, podcast);
   logger.log("info", "Done updating episodes for podcast: "+ podcast.show_title);
  console.log("Done updating episodes for podcast: "+ podcast.show_title);
  x++;
  if (x < arr.length) {
    iteratePodcasts(x, arr);
  }
};

const iterateEpisodes = async function(e, arr, podcast) {
  var ep = arr[e];
  await createEpisode(ep, podcast);
  e++;
  if (e < arr.length) {
    iterateEpisodes(e, arr, podcast);
  }
};

const buildEpisodeData = async function(feed_url, podcast) {
  var promise = queryUrl(feed_url);
  return promise.then(async res => {
    await gatherEpisodes(res, podcast);
  }).catch(err => {
    logger.log("error", err, {
        url: feed_url, 
        pod: podcast
    });
  });
};

const gatherEpisodes = async function(res, podcast) {
  if (res != null) {
    parseStringXml(res, async function(err, result) {
      if (result != null && result != undefined) {
        var channel = result.rss.channel[0];
        if (channel != null && channel != undefined) {
          //var image = channel.image[0].url[0];
          if (channel.hasOwnProperty("item")) {
            var episodelist = channel.item;
            await iterateEpisodes(e, episodelist, podcast);
          }
        }
      }
    });
  }
};

const createEpisode = async function(ep, podcast) {
  var promise = Episode.findOne({ title: ep.title[0] }).exec();
  return promise
    .then(async existingEp => {
      if (existingEp == null) {
        var episode = new Episode();
        var currentdate = new Date(Date.now()).toLocaleString();
        episode.created_date = currentdate;
        var cleanedTitle = ep.title[0].toString();
        cleanedTitle =  cleanedTitle.replace(podcast.show_title, '');
        cleanedTitle =cleanedTitle.replace('Episode','');
        cleanedTitle =cleanedTitle.replace('episode','');
        cleanedTitle =cleanedTitle.replace('-','');
        cleanedTitle =cleanedTitle.replace(' - ','');
        cleanedTitle =cleanedTitle.replace('Podcast','');
        cleanedTitle =cleanedTitle.replace('podcast','');
        cleanedTitle = cleanedTitle.trim();
        episode.title = cleanedTitle;

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
        //  episode.image_url = null; // ep["itunes:image"][0].length > 0 ? ep["itunes:image"][0].$.href : null;

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

        if (ep.hasOwnProperty("itunes:duration") && episode.duration != null) {
          var dur = ep["itunes:duration"][0].toString();
          episode.audio_duration = dur.contains(":") ? null : dur;
        } else {
          episode.audio_duration = null;
        }

        var listTags = [];

        if (ep.hasOwnProperty("itunes:keywords")) {
          var epTags = ep["itunes:keywords"][0];
          if (epTags != null && epTags != "") {
            listTags = epTags.split(",");
            //  episode.tags = await buildTagsForEpisode(epTags, episode);
          }
        } else if (ep.hasOwnProperty("category")) {
          var epTags = ep.category[0];
          if (epTags != null && epTags != "") {
            listTags = epTags.split(",");
            //   episode.tags = await buildTagsForEpisode(epTags, episode);
          }
        } else {
          episode.tags = [];
        }

        return episode
          .save()
          .then(savedEp => {
            var data = {
              tags: listTags,
              episode: savedEp
            };
            return data;
          })
          .catch(err => {
            if (err) throw err;
          });
      }
    })
    .then(async data => {
      if (data != null) {
        await buildTagsForEpisode(data);
      }
    })
    .catch(err => {
      logger.log("error", err);
      if (err) throw err;
    });
};

const buildTagsForEpisode = function(data) {
  if (data != null) {
    var tagList = data.tags;
    var episode = data.episode;

    var t = 0;

    var processTags = function(t) {
      if (t < tagList.length) {
        createTag(episode, tagList[t]).then(function(tag) {
          episode._doc.tags.push(tag);
          return episode
            .save()
            .then(resolved => {
              processTags(t + 1);
              return resolved;
            })
            .catch(err => {
               logger.log("error", err);
             // console.log(err);
            });
        });
      }
    };
    processTags(t);
  }
};

const createTag = function(episode, tagstring) {
  if (tagstring == undefined) {
     logger.log("info", "Empty string for episode: " + episode);
    //console.log(tagstring);
  }
  var promise = Tag.findOne({ description: tagstring.toString() });
  return promise.then(tag => {
    if (tag == null) {
      tag = new Tag();
      tag.description = tagstring.toString();
    }
    tag._doc.associated_episodes.push(episode);
    return tag
      .save()
      .then(tag => {
        return tag;
      })
      .catch(err => {
         logger.log("error", err);
        if (err) throw err;
      });
  });
};

//These two methods should go to web_requests.js
const queryUrl = async function(url) {
  const options = { method: "GET", url: url, json: true };
  return request(options)
    .then(res => {
      return res;
    })
    .catch(err => {
       logger.log("error", err);
      //console.log(err);
    });
};

class ItunesEpisodeUpdater {
  constructor() {}

  static async updateData() {
    await Podcast.getAllPodcasts().then(pods => {
      iteratePodcasts(x, pods);
    });
    // getRSSDataForPodcasts();
  }
}

module.exports = ItunesEpisodeUpdater;
