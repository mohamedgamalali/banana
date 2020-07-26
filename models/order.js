const mongoose = require('mongoose');

const schema = mongoose.Schema;

const orderSchema = new schema({
    client:{
        type: schema.Types.ObjectId,
        ref: 'client'
    },
    category:{
        type:String,
        required:true,
        enum: ['F-V', 'B', 'F-M','F'] 
    },
    product: {
        type: schema.Types.ObjectId,
        ref: 'product'
    },
    arriveDate:{
        type:String
    }
},{timestamps:true});

module.exports = mongoose.model('order', orderSchema);