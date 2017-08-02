

    "use strict";

    const request = require("request-promise");  
    const basepodcast = require("./models/ext-models/base_pod.js");
    const podcast = require('./models/db-models/podcast.js');


    const base_lookup_url = "https://itunes.apple.com/lookup/";
    const options = {
        method: 'GET', 
        url: base_lookup_url, 
        json:true
    }

    const buildItunesQuery =  async function(id) {
        var url = base_lookup_url + id; 
        options.url = url; 
        return options;
    }

    const getItunesIds = function() {
        basepodcast.getAllItunesIds().then(async function(result){
            if(result != null && result.length > 0) {         
                var listOfIds = result; 
                listOfIds.foreach(function(id){
                      var options = await buildItunesQuery(id); 
                });
            }
        })
    }



    class ItunesPodcastUpdater {
            constructor() {
                       
            }

        


             static async update() {
                   await getItunesIds();       
            }

            
    }





    module.exports = ItunesPodcastUpdater;

/*     class ItunesEpisodeUpdater {
         constructor() {

         }

         static update() {

         }


    }


 */