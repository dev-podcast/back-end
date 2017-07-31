



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

