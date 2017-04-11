// episode.js 

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var episodeSchema = new Schema({
  ep_id: { type: Number, required: true },
  title: { type: String, required: true },
  show: { type: String, required: true },
  show_id: Number, 
  description: String,
  audio_url: String,
  date_created: Date,
  duration: Number,   
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag'}] 
});
  guests: [{ type: Schema.Types.ObjectId, ref: 'Guests'}] 

var Podcast = mongoose.model('Episode', episodeSchema); 

module.exports = Episode; 