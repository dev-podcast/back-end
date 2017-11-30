// ** podcast.js **/

var logger = require("winston");   
var mongoose = require("mongoose"); //Reference mongoose.
var Schema = mongoose.Schema;
var AutoIncrement = require("mongoose-auto-increment");
var Tag = require("./tag.js");
var Episode = require("./episode.js");
var ObjectId = require("mongoose").Types.ObjectId;

//Define our model's properties/attributes and their respective types.
var podcastSchema = new Schema({
  show_id: { type: Number },
  show_title: { type: String, required: true },
  network: String,
  description: String,
  image_url: String,
  show_url: String,
  feed_url: String,
  pod_release_date: Date, //need to rename this to episode release date
  episode_count: Number,
  country: String,
  created_date: Date,
  artists: String,
  category: [{ type: Schema.Types.ObjectId, ref: "CategoryType" }],
  host: [{ type: Schema.Types.ObjectId, ref: "Host" }],
  recent_episode_date: Date,
  episodes: [{type: Schema.Types.ObjectId, ref: "Episode"}], 
  recent_episodes: [{type: Schema.Types.ObjectId, ref: "Episode"}],
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }] //Reference the Tag/Focus schema
});

AutoIncrement.initialize(mongoose.connection);

podcastSchema.plugin(AutoIncrement.plugin, {
  model: "Podcast",
  field: "show_id"
});





//podcastSchema.plugin(AutoIncrement, { inc_field: "show_id" });

//Static method that queries the DB and returns all podcasts
podcastSchema.statics.getAllPodcasts = function getAllPodcasts(callback) {
  var promise = Podcast
  .find({})
  .populate("tags", "code description")
  .exec();
  return promise.then(function(docs) {
    if (docs != null && docs.length > 0) {
      var resultset = [];
      var len = docs.length;
      docs.forEach(function(record) {
        resultset.push(record);
      });
      //console.log(docs);
      return resultset;
    } else {
      return new Array();
    }
  }).catch(err => {
    logger.log("error", err);
    //console.log(err);
  });
};

//Static method that gets a podcast with the specified show_id
podcastSchema.statics.getPodcastByID = function getPodcastByID(id, callback) {
  var p_id = new ObjectId(id);
  var promise = this.model("Podcast")
    .find({ _id: p_id })
    .populate({
      path: 'recent_episodes',
      model: 'Episode',
      options: {         
        sort: {published_date: -1}}
  })
    .populate("tags", "code description")
    .exec();
  //.where("_id").equals(id).exec();
  return promise.then(function(doc) {
    if (doc != null && doc.length > 0) {
      var result = doc[0]._doc;
      return result;
    } else {
      return new Array();
    }
  });
};

podcastSchema.statics.getPodcastsByTitle = function getPodcastsByTitle(
  name,
  callback
) {
  var promise = this.model("Podcast")
    .findOne({ show_title: name })
    .populate("tags", "code description")
    .exec();
  return promise.then(function(doc) {
    if (doc != null && doc.length > 0) {
      return doc;
    } else {
      return null;
    }
  });
};

podcastSchema.statics.searchPodcastsByTitle = function searchPodcastsByTitle(
  name,
  callback
) {
  var promise = this.model("Podcast")
    .find({ show_title: { $regex: name, $options: "i" } })
    .populate("tags", "code description")
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

podcastSchema.statics.getRecentPodcasts = function getRecentPodcasts(
  limitTo,
  callback
) {
  var promise = this.model("Podcast")
    .find({},"show_id show_title description image_url show_url pod_release_date artists tags recent_episodes")
    .sort({ pod_release_date: -1 })
    .limit(limitTo)
    .populate({
      path: 'recent_episodes',
      model: 'Episode',
      options: { 
        limit: 10,
        sort: {published_date: -1}}

  })
    .populate('tags', 'code description')
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

podcastSchema.statics.getAllPodcastsByTagName = async function getAllPodcastsByTagName(
  tagname,
  callback
) {
  //var promise = this.model('Podcast').where('tag._id').equals(tag);
  var self = this;
  var resultset = [];
  var tagPromise = Tag.findOne({
                                 description: {$regex: tagname, $options: "i"}
                               })
    .populate({ 
      path: "associated_podcasts"
      , populate: { path:"associated_podcasts.tags"}})
    .exec();
  var associatedPodcasts = [];
  return tagPromise.then(async function(tag) {
    if (tag != null) {
      associatedPodcasts = tag._doc.associated_podcasts;
      if (associatedPodcasts.length > 0) {
        return self.find(
          {
            _id: {
              $in: associatedPodcasts
            }
          },
          "show_title show_id description img_url show_url pod_release_date artists tags recent_episode_date"
        ).populate("tags");
      }
    }
    return new Array();
  }).catch(err => {
    console.log(err);
  });
};

podcastSchema.statics.getAllPodcastsByTagId = async function getAllPodcastsByTagId(
  tag_id,
  callback
) {
  //var promise = this.model('Podcast').where('tag._id').equals(tag);
  var self = this;
  var resultset = [];
  var _id = new ObjectID(tag_id);
 //find({ show_title: { $regex: name, $options: "i" } })
  var tagPromise = Podcast.find({
                                 tags: {$in:_id }
                               })
    .populate("associated_podcasts")
    .exec();
  var associatedPodcasts = [];
  return tagPromise.then(async function(tag) {
    if (tag != null) {
      associatedPodcasts = tag._doc.associated_podcasts;
      if (associatedPodcasts.length > 0) {
        return self.find(
          {
            _id: {
              $in: associatedPodcasts
            }
          },
          "show_title show_id description img_url show_url pod_release_date artists tags recent_episode_date"
        );
      }
    }
    return new Array();
  });
};


//Static method that gets the podcasts with the specified category code
podcastSchema.statics.getPodcastsByCategory = function getPodcastsByCategory(
  cat,
  callback
) {
  var promise = this.model("Podcast")
    .find({ "category.code": cat })
    .populate("tags", "code description")
    .exec();
  return promise.then(function(doc) {
    if (doc != null && doc.length > 0) {
      var result = doc[0]._doc;
      return result;
    } else {
      return new Array();
    }
  });
};

podcastSchema.statics.getPodcastCount = function getPodcastCount(callback) {
  var promise = this.model("Podcast").count({}).exec();
  return promise.then(function(count) {
    return count;
  });
};

//Create a model using the schema we created.
var Podcast = mongoose.model("Podcast", podcastSchema);


//Make this available to our Node application.
module.exports = Podcast;
