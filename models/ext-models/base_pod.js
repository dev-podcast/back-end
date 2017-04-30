//This object represents the structure of the podcast list that was obtained from https://simpleprogrammer.com/2016/10/29/ultimate-list-developer-podcasts/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var basePodSchema = new Schema({
    title: { type: String, required: true },
    description: String
});



var BasePodcast  = mongoose.model('BasePodcast', basePodSchema);

module.exports = BasePodcast;