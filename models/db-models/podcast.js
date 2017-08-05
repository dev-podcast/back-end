// ** podcast.js **/

var mongoose = require('mongoose'); //Reference mongoose. 
var Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence');
var Tag = require("./tag.js").Tag;


//Define our model's properties/attributes and their respective types. 
var podcastSchema = new Schema({
    show_id:  {type: Number},
    show_title: { type: String, required: true},
    network: String,
    description: String, 
    img_url: String,
    show_url: String,
    feed_url: String,
    pod_release_date: Date, //need to rename this to episode release date
    episode_count: Number,
    country: String,
    created_date: Date,
    artists: String,
    category: [{ type: Schema.Types.ObjectId, ref: 'CategoryType'}],
    host: [{ type: Schema.Types.ObjectId, ref: 'Host'}],
    recent_episode_date: Date,
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag'}] //Reference the Tag/Focus schema
});

podcastSchema.plugin(AutoIncrement, {inc_field: 'show_id'});
  

//Static method that queries the DB and returns all podcasts
podcastSchema.statics.getAllPodcasts = function getAllPodcasts(callback) { 
    var promise = this.model('Podcast').find({}).exec();
    return promise.then(function(docs){
        if(docs != null  && docs.length > 0) {
            var resultset = [];
            var len = docs.length;
            docs.forEach(function(record){
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
podcastSchema.statics.getPodcastByID = function getPodcastByID(id, callback) {
    var promise = this.model('Podcast').where('_id').equals(id).exec();
    return promise.then(function(doc){
        if(doc != null  && doc.length > 0) {
            var result = doc[0]._doc;
            return result;
        } else {
            return new Array();
        }
    });
};

podcastSchema.statics.getPodcastsByName = function getPodcastByName(name, callback) {
    var promise = this.model('Podcast').find({"show_title":{"$regex": name,"$options": "i"}}).exec();
    return promise.then(function(docs) {
        if(docs != null  && docs.length > 0) {
            var resultset = [];
            var len = docs.length;
            docs.forEach(function(record){
                resultset.push(record._doc);
            });
          //  console.log(docs);
            return resultset;
        } else {
            return new Array();
        }
    });
}

podcastSchema.statics.getRecentPodcasts = function getRecentPodcasts(limitTo,
  callback
) {
  var promise = this.model("Podcast").find({},'show_id show_title description img_url show_url pod_release_date artists tags').sort({ pod_release_date: -1}).limit(limitTo)
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

podcastSchema.statics.getAllPodcastsByTag = async function getAllPodcastsByTag(tag, callback) {
    //var promise = this.model('Podcast').where('tag._id').equals(tag);
    var self = this;
    var resultset = [];
    var tagPromise = Tag.findOne({_id: tag}).exec();
    var associatedPodcasts = [];
    return tagPromise.then(async function(tag){
        if(tag != null) {
            associatedPodcasts = tag._doc.associated_podcasts;
            if(associatedPodcasts.length > 0){   
                return self.find({
                    _id: {
                        $in: associatedPodcasts
                    }
                },'show_title show_id description img_url show_url pod_release_date artists tags recent_episode_date');       
            }
        }
       // return new Array();
    });
  /*   if(tag != null) {
          var associatedPodcasts = tag._doc.associated_podcasts; 
          if(associatedPodcasts.length > 0) {
            associatedPodcasts.forEach(async (record)=>{
                console.log(record);
                var pod = await this.find({ _id: record }).exec();
                console.log(pod);
                if(pod != null) {
                    resultset.push(pod._doc);
                }             
            });
            return resultset;
          } else {
              return new Array();
          }
         
    } else {
        return new Array();
    } */
}

//Static method that gets the podcasts with the specified category code
podcastSchema.statics.getPodcastsByCategory = function getPodcastsByCategory(cat, callback) {
    var promise =  this.model('Podcast').where('category.code').equals(cat);
    return promise.then(function(doc){
        if(doc != null  && doc.length > 0) {
            var result = doc[0]._doc;
            return result;
        } else {
            return new Array();
        }
    });
}

podcastSchema.statics.getPodcastCount = function getPodcastCount(callback) {
    var promise = this.model('Podcast').count({}).exec();
    return promise.then(function(count) {
        return count;
    });
}

//Create a model using the schema we created.
var Podcast = mongoose.model('Podcast', podcastSchema);


//Make this available to our Node application.
module.exports = Podcast;

