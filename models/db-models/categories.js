
var categorytypes = [
    {"name": "General Interest", "code": 0},
    {"name": "Career and Education" , "code": 1},
    {"name": "Mobile Development", "code":2},
    {"name": "Freelancing" , "code":3}, 
    {"name": "Game Development" , "code": 4},
    {"name": "Javascript and Web" , "code": 5},
    {"name": "Microsoft and .NET" , "code": 6},
    {"name": "Python" , "code": 7}, 
    {"name": "PHP" , "code":8},
    {"name": "Ruby" , "code": 9},
    {"name": "C++, C, C#" , "code": 10},
    {"name": "Java and Co." , "code": 11},
    {"name": "Data and Machine Learning" , "code": 12}, 
    {"name": "Agile/Scrum" , "code": 13}, 
    {"name": "DevOps" , "code": 14},
    {"name": "Cloud" , "code": 15}, 
    {"name": "Databases" , "code": 16}
]


var mongoose = require('mongoose');
var Schema = mongoose.Schema; 

var categorySchema = new Schema({
    name: {type: String , required: true}, 
    code: { type: Number, requrired: true}
});


categorySchema.statics.getAllCategories = function getAllCategories(callback) {
    var promise = this.model('CategoryType').find({}).exec();
    return promise.then(function(docs) {
        if(docs != null && docs.length > 0) {
            var resultset = [];
            var len = docs.length; 
            docs.foreach(function(record){
                resultset.push(record._doc);
            });
            console.log(docs);
            return resultset;
        }
    })
}



categorySchema.statics.getCategoryByCode = function getCategoryByCode(code,callback) {
            var promise = this.model('CategoryType').where('code').equals(code);
            return promise.then(function(doc) {
                if(doc != null && doc.length > 0 ) {
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


categorySchema.statics.getCategoryByName = function getCategoryByName(name,callback) {
            var promise = this.model('CategoryType').where('name').equals(name);
           // console.log("Current name");
          //  console.log(name);
            return promise.then(function(doc) {
                if(doc != null && doc.length > 0 ) {
                    try {
                         var result = doc[0]._doc;
                    }catch (err){
                        console.log(err);
                        console.log("Value of doc")
                        console.log(doc);
                    }
                    console.log(result);
                    return result;
                } else {
                    return null;
                }
            });           
}




var CategoryType = mongoose.model('CategoryType', categorySchema); 




 

module.exports =  {
    CategoryType: CategoryType, 
    CategoryTypes: categorytypes
}