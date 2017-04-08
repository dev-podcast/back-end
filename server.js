var express = require('express');
var http = require("http");
var Promise = require('bluebird');
var fs = require('fs');
var mongoose  = require('mongoose');


 var Podcast = require("./models/podcast"), Tag = require('./models/tag')

// Connection URL to the podcast database
var url = 'mongodb://localhost:27017/dev-podcasts';


mongoose.Promise = Promise;

mongoose.connect(url);

var tag = new Tag({
    description: ".NET", 
    code: 0
});

//create a new podcast called Take up Code
var pod = new Podcast({
    name: 'Take up Code', 
    image: null, 
    description: "Easy way to learn how to code.", 
    hosts: [{"name": "John"}, {"name": "Tim"}], 
    oranization: "unknown", 
    recentairdate: '04/08/2017'

});

tag.save();

pod.save(function(err) {
    if (err) throw err; 

    console.log("Podcast saved successfully.");
});


// var episode = {
//     Title: null, 
//     Description: null, 
//     Length: null, 
//     BroadcastDate: null, 
//     StreamUrl: null
// }