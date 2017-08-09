/* var Itunes = require("../models/ext-models/itunes_podcast.js"),
  ItunesQueryParams = require("../models/ext-models/itunes_query_params.js"), 
  BasePodcast = require("../models/ext-models/base_pod.js"); // ItunesPodcastUpdater = require('./services/itunes_updater_service.js'), //Database model for podcast hosts. // External model for itunes podcast format //Eternal model for use when querying the Itunes API //Base podcast model for the inital podcast names that have acquired.

module.exports = {
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

var fs = require("fs");

fs.readdirSync(__dirname).forEach(function(file) {
  if (file !== "index.js") {
    var moduleName = file.split(".")[0];
    exports[moduleName] = require("./" + moduleName);
  }
});
