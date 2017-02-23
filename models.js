const mongoose = require('mongoose');


const blogPostSchema = mongoose.Schema({
    title: {type: String, required: true},
    author: {firstName: String,
             lastName: String
        },
    content: String,
    created: Date
});

blogPostSchema.virtual('authorName').get(function(){
    return this.author.firstName + ' ' + this.author.lastName;
});

blogPostSchema.methods.apiRepr = function() {
    return {
        id: this._id,
        author: this.authorName,
        content: this.content,
        created: this.created
    };
}


const BlogPost = mongoose.model('Post', blogPostSchema);
module.exports = {BlogPost};