var express = require('express');
var http = require("http");
var Promise = require('bluebird');
var fs = require('fs');
var mongoose  = require('mongoose');
var Audiosearch = require('audiosearch-client-node');

var AUDIOSEARCH_APP_ID = "d4dad46362e5e54ee74ef0cc027f72a05e81e8cc39529661115e7e78d0998414";
var AUDIOSEARCH_SECRET = "42aecc8fe642e535e01861e40e38a45e8f97ae616b6c6883a9cafe8bb4f3b80f"; 


 var Podcast = require("./models/podcast"), Tag = require('./models/tag')

// Connection URL to the podcast database
var url = 'mongodb://localhost:27017/dev-podcasts';


mongoose.Promise = Promise;

mongoose.connect(url);

var tag = new Tag({
    description: ".NET", 
    code: 0
});

tag.save();

//create a new podcast called Take up Code
// var pod = new Podcast({
//     name: 'Take up Code', 
//     image: null, 
//     description: "Easy way to learn how to code.", 
//     hosts: [{"name": "John"}, {"name": "Tim"}], 
//     oranization: "unknown", 
//     recentairdate: '04/08/2017'

// });



// pod.save(function(err) {
//     if (err) throw err; 

//     console.log("Podcast saved successfully.");
// });



var audiosearch = new Audiosearch(AUDIOSEARCH_APP_ID, AUDIOSEARCH_SECRET);

audiosearch.getTastemakers().then(function(results) {
    //do stuff here
});

audiosearch.searchShows('Take up Code').then(function(results){
    //do stuff here;
    if(result != null && result.length > 0) {
       var res  = results[0]; //Get the first result out of the list. 
    }
  
});

// var episode = {
//     Title: null, 
//     Description: null, 
//     Length: null, 
//     BroadcastDate: null, 
//     StreamUrl: null
// }