/*** Tag.js */
var tags = [ //main podcast/episode tag list
    {"description": ".net"}, 
    {"description": "c#"}, 
    {"description": "server"}, 
    {"description": "js"}, 
    {"description": "javascript"}, 
    {"description": "nodejs"}, 
    {"description": "web"}, 
    {"description": "c++"},
    {"description": "vb"}, 
    {"description": "entity framework"}, 
    {"description": "SQL server"}, 
    {"description": "t-sql"}, 
    {"description": "ssrs"},
    {"description": "ssis"},
    {"description": "mobile"},
    {"description": "android"},
    {"description": "ios"},
    {"description": "java"},
    {"description": "react"},
    {"description": "angularjs"},
]


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var AutoIncrement = require("mongoose-auto-increment");

AutoIncrement.initialize(mongoose.connection);

//Define our model's properties/attributes and their respective types. 
var tagSchema = new Schema({
    description: String, 
    code: Number,
    associated_podcasts: [{type: Schema.Types.ObjectId, ref: 'Podcast'}],
    associated_episodes: [{type: Schema.Types.ObjectId, ref: 'Episode'}]
});

//plugin that will reference the code field and cause it to auto increment each time a new record is added. 

tagSchema.plugin(AutoIncrement.plugin, {model: 'Tag', field: 'code'} );
//tagSchema.plugin(AutoIncrement, {inc_field: 'code'});

tagSchema.statics.tagExists = function tagExists(descr, callback) {
     var promise = this.model("Tag").where('description').equals(descr).exec();
     return promise.then(function(doc) {
        if(doc != null & doc.length > 0) {
            return true;
        }else {
            return false;
        }
     });  
}
    tagSchema.statics.getTag = function getTag(descr, callback) {
         var promise = this.model("Tag").where('description').equals(descr).exec();
         return promise.then(function(doc){
              if(doc != null & doc.length > 0) {
                  var result = null;
                  try {
                      result = doc[0]._doc;
                    }catch (err){
                        console.log(err);
                    }
                    return result;
              } else {
                  return result;
              }
         });
    }

//Create a model using the schema we created.
var Tag = mongoose.model('Tag',tagSchema);

//Make this available to our Node application.
module.exports =  {
  Tag: Tag, 
  Tags: tags   
};
