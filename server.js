var express = require('express');
var fs = require('fs');
var app = express();
var http = require("http");
var https = require("https");
var Promise = require('bluebird');
var mongoose  = require('mongoose');
var Audiosearch = require('audiosearch-client-node');
var Podcast = require("./models/db-models/podcast") //Database model for podcast
, Tag = require('./models/db-models/tag') //Database model for tag
, PodCategories = require('./models/db-models/categories.js') //Database model for categories
, Host = require('./models/db-models/host.js')//Database model for podcast hosts.

, Itunes = require("./models/ext-models/itunes_podcast.js") // External model for itunes podcast format
, ItunesQueryParams = require("./models/ext-models/itunes_query_params.js") //Eternal model for use when querying the Itunes API
,BasePodcast = require("./models/ext-models/base_pod.js");//Base podcast model for the inital podcast names that have acquired.


const request = require('request-promise')  
var AUDIOSEARCH_APP_ID = "d4dad46362e5e54ee74ef0cc027f72a05e81e8cc39529661115e7e78d0998414";
var AUDIOSEARCH_SECRET = "42aecc8fe642e535e01861e40e38a45e8f97ae616b6c6883a9cafe8bb4f3b80f"; 
var audiosearch = new Audiosearch(AUDIOSEARCH_APP_ID, AUDIOSEARCH_SECRET);

var base_pod_list_dir = "./base_pod_list"


// Connection URL to the podcast database
var url = 'mongodb://localhost:27017/podcasts';

mongoose.Promise = Promise; //Set the promise object for mongoose. 
mongoose.connect(url); //Connect to the running mongoDB instance




var initializeData = function() {
         
         insertDefaultPodcastCategories(); //Method that updates the Categories collection/table with initial data if there is none. 
         insertDefaultTags(); //Method that updates the Tags collection/table with initial data if there is none. 
         insertBasePodcastList(); //Method that updates the Base Podcast collection/table with initial data if there is none. 

}

initializeData();


function insertBasePodcastList() {
 fs.readdir(base_pod_list_dir, function(err, items) {
      console.log(items);

      if(err) {
          onerror(err);
          return;
      }
      items.forEach(function(filename){
            fs.readFile("./base_pod_list" + "/" + filename, 'utf-8', function(err, content){
                if(err)
                    return;

                var data = JSON.parse(content);
                for(var i = 0; i < data.length; i++){
                    var pod = new BasePodcast({
                        title: data[i]['Podcast Title'],
                        description: data[i].Description
                     });

                     pod.save(function(err) {
                         if (err) throw err; 
                        console.log("Podcast saved successfully.");
                    });
                }
            });
     });
  });

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
    var tag = new Tag.Tag();
    tag.model('Tag').count(function(err, count){
        if(count <= 0){
            for(var i = 0; i < Tag.Tags.length; i++){
                var tagRecord = new Tag.Tag({
                    description: Tag.Tags[i].description
                });

                tagRecord.save(function(err){
                    console.log("Tag: " + tagRecord.description + " was added!");
                });
            }
        }
        return;
    });
}

/******** Begin section for handling server requests**************** */

app.get('/', function (req, res) { //Main page
    if(req.statusCode == 200) { //OK
        
    }
   
});


/*
audiosearch.getTastemakers().then(function(results) {
    //do stuff here
});

audiosearch.searchShows('Take up Code').then(function(results){
    //do stuff here;
    if(result != null && result.length > 0) {
       var res  = results[0]; //Get the first result out of the list. 
    }
  
});*/





// app.get('/test', function(req, res){
//     res.send(getData());       
// });


// var tag = new Tag({
//     description: ".NET", 
//     code: 0
// });

// tag.save();


// var host = new Host({
//     name: "John"
// });

// host.save(function(err){
//    if(err) throw err; 
//    console.log("Host 1 saved!");
// });

// var host2 = new Host({
//     name: "Time"
// })

// host2.save(function(err){
//    if(err) throw err; 
//    console.log("Host 1 saved!");
// });

// var hostlist  = []
// hostlist.push(host);
// hostlist.push(host2);


// Podcast.counterReset('show_id',function(err) {
//     console.log(err);
// });
// //create a new podcast called Take up Code
// var pod = new Podcast({
//     show_title: 'Take up Code', 
//     img_url: null, 
//     description: "Easy way to learn how to code.", 
//     hosts: hostlist,
//     recent_episode_date: '04/08/2017'
// });

// pod.save(function(err){
//     if(err) throw err;
//     console.log("Podcast save!");
// });


function test() {
   
   Podcast.getAllPodcasts().then(function(result) {
        if(result != null && result.length > 0){
            console.log(result);
        }   
    });

   Podcast.getPodcastByID(1, function(req, res){
        console.log(req);
        console.log(res);
    }).then(function(result){
        if(result != null) {
            var pod = result[0]._doc;
        }
        console.log(result);
    });   
}


test();


/*


function buildQueryUrl(data) {
     var url  = 'https://itunes.apple.com/search'
     const options = {
         method: 'GET', 
         url: url, 
         json:true,
         qs: {
             term: 'jack johnson', 
             entity: 'musicVideo'
         }
     }
    console.log(options);
    return options;
}


function getData() {
     request(buildQueryUrl()).then(function(response){
        console.log(response);
     }).catch(function(err){
            console.log(err);
     });
 }

getData();

*/