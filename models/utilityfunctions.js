



var base_pod_list_dir = "./base_pod_list";


function insertBasePodcastList() {
 fs.readdir(base_pod_list_dir, function(err, items) {
      console.log(items);

      if(err) {
          onerror(err);
          return;
      }
      items.forEach(function(filename){
            fs.readFile(base_pod_list_dir+ "/" + filename, 'utf-8', function(err, content){
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