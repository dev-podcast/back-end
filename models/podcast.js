// ** podcast.js **/

var mongoose = require('mongoose'); //Reference mongoose. 
var Schema = mongoose.Schema;

//Define our model's properties/attributes and their respective types. 
var podcastSchema = new Schema({
    name: { type: String, required: true},
    image: String, 
    description: String, 
    url: String,
    hosts: [{
        name: String
    }], 
    recentairdate: Date,
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag'}] //Reference the Tag/Focus schema
});

//Create a model using the schema we created.
var Podcast = mongoose.model('Podcast', podcastSchema);


//Make this available to our Node application.
module.exports = Podcast;

