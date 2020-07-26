const mongoose = require('mongoose');

const schema = mongoose.Schema;

const clientSchema = new schema({
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
    verfication: {
        type: Boolean,
        default: false
    },
    blocked: {
        type: Boolean,
        default: false
    },
    cart: [{
        product: {
            type: schema.Types.ObjectId,
            ref: 'product'
        },
        amount: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            required: true
        }
    }],
    wallet: {
        type: Number,
        default: 0
    },
    FCMJwt: [{
        type: String
    }],
    sendNotfication:{
        type:Boolean,
        default:true
    },
});

module.exports = mongoose.model('client', clientSchema);