const mongoose = require('mongoose');

const schema = mongoose.Schema;

const offerSchema = new schema({
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
    banana_delivery: {
        type: Boolean,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
}, { timestamps: true });


module.exports = mongoose.model('offer', offerSchema);