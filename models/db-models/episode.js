// episode.js 

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var AutoIncrement = require("mongoose-sequence");

var episodeSchema = new Schema({
  ep_id: { type: Number},
  title: { type: String, required: true },
  show: {type: Schema.Types.ObjectId, ref: 'Podcast', required: true}, 
  author: String,
  description: String,
  audio_url: String,
  audio_type: String,
  audio_duration: String,
  published_date: Date,
  created_date: Date,
  image_url: String,   
  source_url: String,

  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag'}]
 // guests: [{ type: Schema.Types.ObjectId, ref: 'Guests'}] 
});



//Static method that queries the DB and returns all episodes
episodeSchema.statics.getAllEpisodes = function getAllEpisodes(
  show_id,
  callback
) {
  var promise = this.model("Episode").where("show.show_id").equals(show_id).exec();
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
episodeSchema.statics.getEpisodesByID = function getEpisodesByID(id, callback) {
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
  tag,
  callback
) {
  var promise = the.model("Episode").where("tags._id").equals(tag);
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

episodeSchema.statics.getRecentEpisodes = function getRecentEpisodes(show_id,
  limitTo,
  callback
) {
  var promise = this.model("Episode")
    .find({show: show_id})
    .sort({ published_date: -1})
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

 

episodeSchema.plugin(AutoIncrement, { inc_field: "ep_id" });

var Episode = mongoose.model('Episode', episodeSchema); 

module.exports = Episode; 