const mongoose = require('mongoose');

const schema = mongoose.Schema;

const issueSchema = new schema({
    client: {
        type: schema.Types.ObjectId,
        ref: 'client'
    },
    order:{
        type: schema.Types.ObjectId,
        ref: 'order'
    },
    reason:{
        type: String,
        required:true
    },
    demands:{
        type: String,
        required:true
    },
    imageUrl:[{
        type:String,
        required:true
    }]
});

module.exports = mongoose.model('issue', issueSchema);