var express = require('express');
var fs = require('fs');
var app = express();
var urijs = require('urijs');
var http = require("http");
var https = require("https");
var Promise = require('bluebird');
var mongoose  = require('mongoose');
var Audiosearch = require('audiosearch-client-node');
var Podcast = require("./models/db-models/podcast"), //Database model for podcast
  Tag = require("./models/db-models/tag").Tag, //Database model for tag
  Tags = require("./models/db-models/tag").Tags,
  PodCategories = require("./models/db-models/categories.js"), //Database model for categories
  Host = require("./models/db-models/host.js"), //Database model for podcast hosts.
 // ItunesPodcastUpdater = require('./services/itunes_updater_service.js'),
  Itunes = require("./models/ext-models/itunes_podcast.js"), // External model for itunes podcast format
  ItunesQueryParams = require("./models/ext-models/itunes_query_params.js"), //Eternal model for use when querying the Itunes API
  BasePodcast = require("./models/ext-models/base_pod.js");//Base podcast model for the inital podcast names that have acquired.

const request = require('request-promise')  

var AUDIOSEARCH_APP_ID = "d4dad46362e5e54ee74ef0cc027f72a05e81e8cc39529661115e7e78d0998414";
var AUDIOSEARCH_SECRET = "42aecc8fe642e535e01861e40e38a45e8f97ae616b6c6883a9cafe8bb4f3b80f"; 
var audiosearch = new Audiosearch(AUDIOSEARCH_APP_ID, AUDIOSEARCH_SECRET);





//Server start

var initializeDB = function() {
    // Connection URL to the podcast database
var url = 'mongodb://localhost:27017/podcasts';

mongoose.Promise = Promise; //Set the promise object for mongoose. 
mongoose.connect(url); //Connect to the running mongoDB instance





//let updater = new ItunesPodcastUpdater();
//console.log(updater.podcasts);
}

var initializeData = function() {
         
    
        // insertDefaultPodcastCategories(); //Method that updates the Categories collection/table with initial data if there is none. 
         insertDefaultTags(); //Method that updates the Tags collection/table with initial data if there is none. 
        // insertBasePodcastList(); //Method that updates the Base Podcast collection/table with initial data if there is none. 
}




function insertDefaultPodcastCategories() {
    var cat = new PodCategories.CategoryType();
    cat.model('CategoryType').count( function(err, count) {
        if(count <= 0){
                for(var i = 0; i < PodCategories.CategoryTypes.length; i++){       
                    var categoryType = new PodCategories.CategoryType ({
                        name: PodCategories.CategoryTypes[i].name, 
                        code: PodCategories.CategoryTypes[i].code
                    });

                    categoryType.save(function(err){
                        console.log("Cateogory: " + categoryType.name + " was added!");
                    });
                 }   
        } 
        return;
       
    });  
}

function insertDefaultTags() {
    
    Tag.count(async function(err, count){
        if(count <= 0){
            for(var i = 0; i < Tags.length; i++){
                var exists = await Tag.findOne({description: Tags[i].description.toString()}).exec();
                if(!exists){
                     var tagRecord = new Tag({
                        description: Tags[i].description
                     });
                }
                tagRecord.save(function(err){
                    console.log("Tag: " + tagRecord.description + " was added!");
                });
            }
        }
        return;
    });
}




initializeDB();
//initializeData();




var updatePodcastData = function() {
    //Get all itunes ids
    BasePodcast.getAllItunesIds().then(async function(result){
        if(result != null && result.length > 0) {
             var listofIds = result;
             for(var i = 0; i < listofIds.length; i++){
                 var itunes_id = listofIds[i];

               // setInterval(function() {
                   await buildItunesQueryUrl(itunes_id);
                //}, 5000);

                 //buildQueryUrl(itunes_id);

             }
        }
       
    });
}

////updatePodcastData();


var buildItunesQueryUrl = async function(id) {
     var url  = 'https://itunes.apple.com/lookup/' + id;
     const options = {
         method: 'GET', 
         url: url, 
         json:true       
     }
    request(options).then(async function(response){
      if(response != null && response.resultCount > 0) {
        var responsePod = response.results[0];
        var exists = await Podcast.findOne({show_title: responsePod.trackName.toString()}).exec();
        if(!exists) {
            var podcast = new Podcast();
            
            podcast.show_title = responsePod.trackName;
            podcast.img_url = responsePod.artworkUrl100; 
            podcast.feed_url = responsePod.feed_url;
            podcast.episode_count = responsePod.trackCount;
            podcast.country = responsePod.country; 
            await BasePodcast.findOne({title: responsePod.trackName}).select('podcast_site category').exec(function(err, basepod){
                if(basepod != null) {
                    podcast.show_url = basepod._doc.podcast_site;
                    podcast.category = basepod._doc.category;
                }       
            });

            var genres = responsePod.genres;
            var listOfTags = await queryOrInsertTags(genres);

            podcast.tags = listOfTags;
            
            //TODO: Need to clean up some of the host names coming out Itunes. 
            var host = new Host(); 
            host.name =  responsePod.artistName; 
           // host.associated_podcast = podcast; 
            
           host.save(function(err){
             if(err) throw err;
           });
           // console.log(host.name);
            
            var date =  Date.parse(responsePod.releaseDate);     
            if(isNaN(date) == false) {
                var d = new Date(responsePod.releaseDate);
                podcast.releaseDate = d;
            } else {
                date = null;
            }
            
            podcast.host = host;

            podcast.save(function(err){
                if(err) throw err;
               // console.log("Podcast: " + podcast.show_title + " saved!");
            }); 
        }
      }    
     }).catch(function(err){
            console.log(err);
     });
}

var queryOrHost = async function(host) {
    
}

var queryOrInsertTags = async function(genres) {
    var tags = new Array();
    if(genres.length > 0) {
         for(var i = 0; i < genres.length; i++){
                var tag = null;   
                     var doc = await Tag.findOne({description: genres[i].toString()}).exec(); // await Tag.tagExists(genres[0]);                
                if(doc == null || doc._doc == null){
                 
                    tag = new Tag(); 
                    tag.description = genres[i];
                    tag.save(function(err){
                        if(err) throw err;
                       // console.log("Tag saved!");
                    })
                } else {
                    tag = doc._doc;
                }
                 
                 tags.push(tag);
            }
        }
        return tags;
}


/******** Begin section for handling server requests**************** */




    var server = app.listen(9000, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)
});

//Get all podcasts
app.get('/api/podcasts', function (req, res) { //Main page
        Podcast.getAllPodcasts().then(function(result) {        
                res.end(JSON.stringify(result)); 
        });  
});

//Get all podcasts that contain the specified tag
app.get('/api/podcasts/tag/:tag',function(req,res) {
    var tag = req.params.tag;
    Podcast.getAllPodcastsByTag(tag).then(function(result) {
        res.end(JSON.stringify(result));
    });
});

//All podcasts for a specific category
app.get('/api/podcasts/category/:type', function(req, res) {
    var cat = req.params.type;
    Podcast.getPodcastsByCategory(cat).then(function(result) {
        res.end(JSON.stringify(result));
    });
});

//Get all podcast categories. 
app.get('/api/category', function(req, res){
    CategoryType.getAllCategories().then(function(result){
        res.end(JSON.stringify(result));
    })
});


//Get the podcast with the specified ID 
app.get('/api/podcasts/:id', function(req, res) {
    var id = req.params.id;
    Podcast.getPodcastByID(id).then(function(result) {
        res.end(JSON.stringify(result));
    });
});

app.get('/api/podcasts/search/:name', function(req,res){
    var name = req.params.name;
    Podcast.getPodcastsByName(name).then(function(result){
        res.end(JSON.stringify(result));
    });
});
