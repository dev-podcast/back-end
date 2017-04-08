// episode.js 

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var episodeSchema = new Schema({
  
  title: { type: String, required: true },
  description: String,
  url: String,
  airDate: Date,
  length: Number,   
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag'}] 

});

var Podcast = mongoose.model('Episode', episodeSchema); 

module.exports = Episode; 