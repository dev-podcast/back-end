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
var AutoIncrement = require('mongoose-sequence');

//Define our model's properties/attributes and their respective types. 
var tagSchema = new Schema({
    description: String, 
    code: Number
});

//plugin that will reference the code field and cause it to auto increment each time a new record is added. 
tagSchema.plugin(AutoIncrement, {inc_field: 'code'});


//Create a model using the schema we created.
var Tag = mongoose.model('Tag',tagSchema);

//Make this available to our Node application.
module.exports =  {
  Tag: Tag, 
  Tags: tags   
};
