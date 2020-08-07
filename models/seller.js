const mongoose = require('mongoose');

const schema = mongoose.Schema;

const sellerSchema = new schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    category:[{
        type:String,
        enum: ['F-V', 'B', 'F-M','F'],
        required:true
    }],
    verfication: {
        type: Boolean,
        default: false
    },
    blocked: {
        type: Boolean,
        default: false
    },
    wallet: {
        type: Number,
        default: 0
    },
    FCMJwt: [{
        type: String
    }],
    sendNotfication: {
        type: Boolean,
        default: true
    },
    accountExpiration:{
        type:Number,
        required:true
    }
});



module.exports = mongoose.model('seller', sellerSchema);