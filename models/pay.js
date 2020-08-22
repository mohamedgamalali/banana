const mongoose = require('mongoose');

const schema = mongoose.Schema;

const paySchema = new schema({
    name: {
        type:String,
        required:true
    },
    mobile: {
        type:String,
        required:true
    },
    adressString: {
        type:String,
        required:true
    },
    arriveIn: {
        type: Number,
        default: 0
    },
    offer: {
        type: schema.Types.ObjectId,
        ref: 'offer'
    },
    order: {
        type: schema.Types.ObjectId,
        ref: 'order'
    },
    client: {
        type: schema.Types.ObjectId,
        ref: 'client'
    },
    seller: {
        type: schema.Types.ObjectId,
        ref: 'seller'
    },
    payId:{
        type:String,
        required:true
    },
    deliver :{
        type:Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model('pay', paySchema);