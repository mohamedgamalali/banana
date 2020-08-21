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
    seller:{
        type: schema.Types.ObjectId,
        ref: 'seller'
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
    }],
    state:{
        type:String,
        default:'binding',
        enum:['binding','ok','cancel']
    }
});

module.exports = mongoose.model('issue', issueSchema);