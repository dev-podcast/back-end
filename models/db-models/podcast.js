// ** podcast.js **/

var mongoose = require('mongoose'); //Reference mongoose. 
var Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence');


//Define our model's properties/attributes and their respective types. 
var podcastSchema = new Schema({
    show_id:  {type: Number},
    show_title: { type: String, required: true},
    network: String,
    description: String, 
    img_url: String,
    show_url: String,
    feed_url: String,
    releaseDate: Date,
    episode_count: Number,
    country: String,
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
    var promise = this.model('Podcast').where('show_id').equals(id).exec();
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

podcastSchema.statics.getAllPodcastsByTag = function getAllPodcastsByTag(tag, callback) {
    var promise = the.model('Podcast').where('tag.description').equals(tag);
    return promise.then(function(docs){
         if(docs != null  && docs.length > 0) {
            var resultset = [];
            var len = docs.length;
            docs.forEach(function(record){
                resultset.push(record._doc);
            });
           // console.log(docs);
            return resultset;
        } else {
            return new Array();
        }
    });
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

