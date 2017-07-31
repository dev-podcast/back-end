var express = require('express');
var fs = require('fs');
var app = express();
var urijs = require('urijs');
var http = require("http");
var https = require("https");
var Promise = require('bluebird');
var mongoose  = require('mongoose');
var Audiosearch = require('audiosearch-client-node');
var Podcast = require("./models/db-models/podcast") //Database model for podcast
, Tag = require('./models/db-models/tag').Tag //Database model for tag
, PodCategories = require('./models/db-models/categories.js') //Database model for categories
, Host = require('./models/db-models/host.js')//Database model for podcast hosts.

, Itunes = require("./models/ext-models/itunes_podcast.js") // External model for itunes podcast format
, ItunesQueryParams = require("./models/ext-models/itunes_query_params.js") //Eternal model for use when querying the Itunes API
,BasePodcast = require("./models/ext-models/base_pod.js");//Base podcast model for the inital podcast names that have acquired.


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

}

var initializeData = function() {
         
         insertDefaultPodcastCategories(); //Method that updates the Categories collection/table with initial data if there is none. 
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
    var tag = new Tag();
    tag.model('Tag').count(function(err, count){
        if(count <= 0){
            for(var i = 0; i < Tag.Tags.length; i++){
                var tagRecord = new Tag({
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




initializeDB();
initializeData();



/* 
var setupListBaseListOfPodcasts  = function() {
    var podlist = './podlist';
    fs.readdir(podlist, function(err, items) {
      console.log(items);

      if(err) {
          onerror(err);
          return;
      }
      items.forEach(function(filename){
            fs.readFile(podlist+ "/" + filename, 'utf-8', function(err, content){
                if(err)
                    return;

                var data = JSON.parse(content);
                var propertyList = new Array();
                var count = 0; 
                for(var property in data){
                    if(data.hasOwnProperty(property)){                                
                        PodCategories.CategoryType.getCategoryByName(property).then(function(result){ 
                            if(result != null) {
                                  var cat = data[result.name]; 
                                   console.log("Property: " + result.name + "items: " + cat.length.toString());
                                  
                                  createBasePodcastRecords(cat,result);   
                            }                                                                                                          
                        });                                            
                    }                 
                }           
            });
     });
  });
}
 

setupListBaseListOfPodcasts();


var createBasePodcastRecords = function(data,categorytype) {
                            if(categorytype != null) {
                                
                                 for(var i = 0; i < data.length; i++){                                                           
                                        var pod = data[i]; 

                                        if(pod != null && pod != undefined){

                                    
                                        var description = pod["Description"];
                                        var podcast_site = pod["Website URL"];
                                        var title = pod["Podcast Title"]; 
                                        var subscriberUrl = pod["Subscribe URL"].toString();   
                                        var qs = subscriberUrl.split('/');
                                        var unformattedID = qs[qs.length-1].split("?");
                                        var itunes_id = unformattedID[0];
                                    


                                        var pod = new BasePodcast({
                                            title: title,
                                            description: description,
                                            podcast_site: podcast_site,
                                            itunes_subscriber_url: subscriberUrl, 
                                            itunes_id: itunes_id,
                                            category: categorytype
                                            
                                        });
                                        
                                         

                                         pod.save(function(err) {
                                            if (err) throw err; 
                                            console.log("Podcast saved successfully.");
                                        }); 
                                        }
                                    }
                            }
}

 */

/*   PodCategories.CategoryType.getCategoryByCode(3).then(function(data){
        BasePodcast.getBasePodcastsByCategory(data).then(function(result){
            if(result) {
                console.log(result);
            }
        });
  }); */

var setupPodcastData = function() {
    //Get all itunes ids
    BasePodcast.getAllItunesId().then(function(result){
        if(result != null && result.length > 0) {
             var listofIds = result;
             for(var i = 0; i < listofIds.length; i++){
                 var itunes_id = listofIds[i];

                setInterval(function() {
                    buildQueryUrl(itunes_id);
                }, 5000);

                 //buildQueryUrl(itunes_id);

             }
        }
       
    });
}

setupPodcastData();


var buildQueryUrl = async function(id) {
     var url  = 'https://itunes.apple.com/lookup/' + id;
     const options = {
         method: 'GET', 
         url: url, 
         json:true       
     }
    request(options).then(async function(response){
      //  console.log(response);
      if(response != null && response.resultCount > 0) {
        var responsePod = response.results[0];
         var podcast = new Podcast(); 
        podcast.show_title = responsePod.trackName;
        podcast.img_url = responsePod.artworkUrl100; 
        podcast.feed_url = responsePod.feed_url;
        podcast.episode_count = responsePod.trackCount;
        podcast.country = responsePod.country; 
        await BasePodcast.findOne({title: responsePod.trackName}).select('podcast_site').exec(function(err, basepod){
            if(basepod != null) {
                podcast.show_url = basepod._doc.podcast_site;
            }       
        });

        var genres = responsePod.genres;
        var listOfGenres = await queryOrInsertTags(genres);

        var host = new Host(); 
        host.name =  responsePod.artistName; 
        host.associated_podcast = podcast; 

       /*  host.save(function(err){
            if(err) throw err;
            console.log(err);
        }); */

        var date = new Date(responsePod.releaseDate);
        podcast.releaseDate = date;

        podcast.host = host;

         podcast.save(function(err){
             if(err) throw err;
             console.log("Podcast save!");
        }); 

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
                var exists = await Tag.findOne({description: genres[i].toString()}).exec(); // await Tag.tagExists(genres[0]);                
                if(exists != null){
                   Tag.getTag(genres[i]).then(function(result) {
                       if(result != null) {
                         tag = result;
                       }                    
                   });
                } else {
                    tag = new Tag(); 
                    tag.description = genres[i];
                    tag.save(function(err){
                        if(err) throw err;
                        console.log("Tag saved!");
                    })
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
            if(result != null && result.length > 0){
                console.log(result);
                res.end(JSON.stringify(result));
            }   
        });  
});

//All podcasts for a specific category
app.get('/api/category/:type', function(req, res) {
    var cat = req.param('type');
    Podcast.getPodcastsByCategory(cat).then(function(result) {
        res.end(JSON.stringify(result));
    });
});


//Get the podcast with the specified ID 
app.get('/api/podcasts/:id', function(req, res) {
    var id = req.param('id');
    Podcast.getPodcastByID(id).then(function(result) {
        res.end(JSON.stringify(result));
    });
});



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


// function test() {
   
//    Podcast.getAllPodcasts().then(function(result) {
//         if(result != null && result.length > 0){
//             console.log(result);
//         }   
//     });

//    Podcast.getPodcastByID(1, function(req, res){
//         console.log(req);
//         console.log(res);
//     }).then(function(result){
//         if(result != null) {
//             var pod = result[0]._doc;
//         }
//         console.log(result);
//     });   
// }


// test();


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