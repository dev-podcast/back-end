// ** podcast.js **/

var mongoose = require('mongoose'); //Reference mongoose. 
var Schema = mongoose.Schema;

//Define our model's properties/attributes and their respective types. 
var podcastSchema = new Schema({
    show_id: { type: Number, required: true },
    show_title: { type: String, required: true},
    network: String,
    description: String, 
    img_url: String,
    show_url: String,
    hosts: [{ type: Schema.Types.ObjectId, ref: 'Hosts'}],
    recent_episode_date: Date,
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag'}] //Reference the Tag/Focus schema
});

//Create a model using the schema we created.
var Podcast = mongoose.model('Podcast', podcastSchema);


//Make this available to our Node application.
module.exports = Podcast;

