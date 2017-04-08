/*** Tag.js */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Define our model's properties/attributes and their respective types. 
var tagSchema = new Schema({
    description: String, 
    code: Number
});

//Create a model using the schema we created.
var Tag = mongoose.model('Tag',tagSchema);


//Make this available to our Node application.
module.exports = Tag;
