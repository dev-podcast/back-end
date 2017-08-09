"use strict";
const db_models = require("./models/db-models");
const request = require("request-promise");
const Episode = db_models.episode;
const Podcast = db_models.podcast;
const Tag = db_models.tag;


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


class ItunesEpisodeUpdater {
  constructor() {}

  static async updateData() {
        getRSSDataForPodcasts();
  }
}

module.exports = ItunesEpisodeUpdater;