//This object represents the structure of the podcast list that was obtained from https://simpleprogrammer.com/2016/10/29/ultimate-list-developer-podcasts/
var logger = require("winston");   
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var basePodSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    podcast_site: String, 
    itunes_subscriber_url: String, 
    itunes_id: String,
    category: [{ type: Schema.Types.ObjectId, ref: 'CategoryType'}],

});

basePodSchema.statics.getAllBasePodcasts = function getAllBasePodcasts(callback) {
    var promise = this.model('BasePodcast').find({}).exec();
    return promise.then(function(docs) {
        if(docs != null && docs.length > 0) {
            var resultset = [];
            var len = docs.length; 
            docs.foreach(function(record){
                resultset.push(record._doc);
            });
             //logger.log("info", docs);
            //console.log(docs);
            return resultset;
        }
    })
}

basePodSchema.statics.getAllItunesIds = function getAllItunesId(callback) {
    var promise = this.model('BasePodcast').find({}).exec();
    return promise.then(function(docs) {
        if(docs != null && docs.length > 0) {
            var resultset = [];
            
            var len = docs.length;
            for(var i = 0; i < docs.length; i++){
                var record = docs[i]; 
                resultset.push(record._doc.itunes_id);
            } 
           /*  docs.foreach(function(record){
                resultset.push(record._doc.itunes_id);
           // }); */
           // console.log(docs);
            return resultset;
        }
    })
}

basePodSchema.statics.getBasePodcastsByCategory = function getBasePodcastsByCategory(cat,callback) {
         var promise = this.model("BasePodcast").where('category').equals(cat);
            return promise.then(function(doc) {
             if(doc != null && doc.length > 0){
                  var result = new Array();
                 if(doc.length > 1){
                    for(var i = 0; i < doc.length; i++){
                        result.push(doc[i]._doc);
                    }
                 } else {
                    result  = doc[0]._doc;
                 }
               
            return result;
             } else {
            return new Array();
        }
         });
   
}


var BasePodcast  = mongoose.model('BasePodcast', basePodSchema);

module.exports = BasePodcast;