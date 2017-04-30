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
    category: [{ type: Schema.Types.ObjectId, ref: 'CategoryType'}],
    hosts: [{ type: Schema.Types.ObjectId, ref: 'Hosts'}],
    recent_episode_date: Date,
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag'}] //Reference the Tag/Focus schema
});

podcastSchema.plugin(AutoIncrement, {inc_field: 'show_id'});
  

//Static method that queries the DB and returns all podcasts
podcastSchema.statics.getAllPodcasts = function getAllPodcasts(callback) { 
    return this.model('Podcast').findOne({}, function(err, docs){
        if(!err) {
            if(docs != null){
            var resultset = [];
            docs.forEach(function (record){
                resultset.push(record._doc);
            });
            console.log(docs);
           // process.exit();
           return resultset;
        }
        } else {throw err}
    });
};


//Static method that gets a podcast with the specified show_id
podcastSchema.statics.getPodcastByID = function getPodcastByID(id, callback) {
    return this.model('Podcast').where('show_id').equals(id);
};

//Static method that gets the podcasts with the specified category code
podcastSchema.statics.getPodcastsByCategory = function getPodcastsByCategory(cat, callback) {
    return this.model('Podcast').where('category.code').equals(cat);
}

//Create a model using the schema we created.
var Podcast = mongoose.model('Podcast', podcastSchema);


//Make this available to our Node application.
module.exports = Podcast;

