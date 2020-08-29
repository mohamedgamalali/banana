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
    },
    status:{
        type:String,
        default:'started',
        enum:['started','ended','cancel']
    },
    selected:{
        type:Boolean,
        default:false
    },
    offerProducts: [{
        cartItem: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            enum: ['kg', 'g', 'grain', 'Liter', 'Gallon', 'drzn', 'bag'],
            required: true
        },
        equals:{
            type:Boolean,
            required:true
        }
    }]
}, { timestamps: true });

offerSchema.methods.cancel = function () {
    this.status  =  'cancel'
    return this.save();
}

offerSchema.methods.ended = function () {
    this.status  =  'ended'
    return this.save();
}

module.exports = mongoose.model('offer', offerSchema);