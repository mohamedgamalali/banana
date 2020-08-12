const mongoose = require('mongoose');

const schema = mongoose.Schema;

const orderSchema = new schema({
    client: {
        type: schema.Types.ObjectId,
        ref: 'client'
    },
    category: [{
        type: String,
        required: true,
        enum: ['F-V', 'B', 'F-M', 'F']
    }],
    products: [{
        product: {
            type: schema.Types.Mixed,
            refPath: 'products.path'
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
        path: {
            type: String,
            default: 'product'
        }
    }],
    arriveDate: {
        type: Number
    },
    location: {
        type: { type: String },
        coordinates: [Number]
    },
    stringAdress: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'started'
    },
    pay: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

orderSchema.index({ location: "2dsphere" });

orderSchema.methods.cancelOrder = function () {
    this.status = 'cancel';
    return this.save();
};

orderSchema.methods.endOrder = function () {
    this.status = 'ended';
    return this.save();
};


module.exports = mongoose.model('order', orderSchema);