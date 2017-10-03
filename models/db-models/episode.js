// episode.js
var logger = require("winston");   
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var AutoIncrement = require("mongoose-auto-increment");
var ObjectId = require("mongoose").Types.ObjectId;


AutoIncrement.initialize(mongoose.connection);

var episodeSchema = new Schema({
  ep_id: { type: Number },
  title: { type: String, required: true },
  show: { type: Schema.Types.ObjectId, ref: "Podcast", required: true },
  author: String,
  description: String,
  audio_url: String,
  audio_type: String,
  audio_duration: String,
  published_date: Date,
  created_date: Date,
  image_url: String,
  source_url: String,

  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }]
  // guests: [{ type: Schema.Types.ObjectId, ref: 'Guests'}]
});


episodeSchema.plugin(AutoIncrement.plugin, {
  model: "Episode",
  field: "ep_id"
});

//episodeSchema.plugin(AutoIncrement, { inc_field: "ep_id" });



//Static method that queries the DB and returns all episodes
episodeSchema.statics.getAllEpisodes = function getAllEpisodes(
  show_id
) {
  var self = this;
  var promise = self
    .find({
            show: show_id
          })
    .sort({ published_date: -1 })
    .exec();
  return promise.then(function(docs) {
    if (docs != null && docs.length > 0) {
      var resultset = [];
      var len = docs.length;
      docs.forEach(function(record) {
        resultset.push(record._doc);
      });
      //console.log(docs);
      return resultset;
    } else {
      return new Array();
    }
  });
};

//Static method that gets a podcast with the specified show_id
episodeSchema.statics.getEpisodesByID = function getEpisodesByID(id) {
  var self = this;
  var promise = this.model("Episode").where("_id").equals(id).exec();
  return promise.then(function(doc) {
    if (doc != null && doc.length > 0) {
      var result = doc[0]._doc;
      return result;
    } else {
      return new Array();
    }
  });
};

episodeSchema.statics.getAllEpisodesByTag = function getAllEpisodesByTag(
  show_id,
  tag_id
) {
  /* try {
    _id = new ObjectId(show_id);
  } catch (err) {
    return err;
  } */
  var self = this;
  var tagPromise = self
    .findOne({
      _id: tag_id,
      show: show_id
    })
    .exec();
  var associatedEpisodes = [];
  return tagPromise.then(async tag => {
    if (tag != null) {
      associatedEpisodes = tag._doc.associated_episodes;
      if (associatedEpisodes.length > 0) {
        return self.find({
          _id: {
            $in: associatedEpisodes
          }
        });
      }
    }
    return new Array();
  });
  return promise.then(function(docs) {
    if (docs != null && docs.length > 0) {
      var resultset = [];
      var len = docs.length;
      docs.forEach(function(record) {
        resultset.push(record._doc);
      });
      // console.log(docs);
      return resultset;
    } else {
      return new Array();
    }
  });
};

episodeSchema.statics.getRecentEpisodes = function getRecentEpisodes(
  show_id,
  limitTo
) {
  var self = this;
  

  var promise = self
    .find({
            show: show_id
          })
    .sort({ published_date: -1 })
    .limit(limitTo)
    .exec();
  return promise.then(function(docs) {
    if (docs != null && docs.length > 0) {
      var resultset = [];
      var len = docs.length;
      docs.forEach(function(record) {
        resultset.push(record._doc);
      });
      //  console.log(docs);
      return resultset;
    } else {
      return new Array();
    }
  });
};


var Episode = mongoose.model("Episode", episodeSchema);

module.exports = Episode;
