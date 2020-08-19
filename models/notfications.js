const mongoose = require('mongoose');

const schema   = mongoose.Schema;

const notficationSchema = new schema({
    user:{
        type:schema.Types.ObjectId,
        ref:'client'
    },
    data:{
        id:String,
        key:String,
    },
    notification:{
        title:String,
        body:String
    },
    date:{
        type:String,
        required:true
    }
},{timestamps:true});

module.exports = mongoose.model('notfication',notficationSchema);