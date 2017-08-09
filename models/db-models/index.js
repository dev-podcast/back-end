/* var Podcast = require("../models/db-models/podcast.js"), //Database model for podcast
  Tag = require("../models/db-models/tag").Tag, //Database model for tag
  Tags = require("../models/db-models/tag").Tags,
  CategoryType = require("../models/db-models/categories.js").CategoryType, //Database model for categories
  CategoryTypes = require("../models/db-models/categories.js").CategoryTypes,
  Host = require("../models/db-models/host.js"),
  Episode = require("../models/db-models/episode.js");
 
 */
var fs = require("fs");

fs.readdirSync(__dirname).forEach(function(file){
  if(file !== 'index.js') {
    var moduleName = file.split('.')[0]; 
    exports[moduleName] =require('./' + moduleName);
  }
});

/* module.exports = {
  Podcast: Podcast,
  Tag: Tag,
  Tags: Tags, 
  CategoryType: CategoryType, 
  CategoryTypes: CategoryTypes,
  Host: Host, 
  Episode: Episode, 
  Itunes: Itunes, 
  ItunesQueryParams: ItunesQueryParams,
  BasePodcast: BasePodcast
}; */