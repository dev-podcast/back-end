// ** host.js **/
var mongoose = require('mongoose');
var Schema = mongoose.Schema; 

//Define our model's properties/attributes and their respective types. 
var hostSchema = new Schema({
    name: {type: String , require: true}, //Name of the podcast host
   // associated_podcast: {type: Schema.Types.ObjectId, ref: 'Podcast'}  //Foreign key relationship with Podcast collection/table 
}) 

var Host = mongoose.model('Host', hostSchema);

module.exports = Host;