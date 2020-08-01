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
            type: schema.Types.Mixed,
            refPath: 'cart.path'
        },
        amount: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            enum: ['kg', 'g', 'grain', 'Liter', 'Gallon', 'drzn','bag'],
            required: true
        },
        path:{
            type:String,
            default:'product'
        }
    }],
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
});

clientSchema.methods.addToCart = function (prodductId, amount, unit,ref) {
    const CreatedBerore = this.cart.findIndex(val => {
        return val.product.toString() === prodductId.toString() && unit === val.unit;
    });

    let newAmount = 1;
    const updatedCartItems = [...this.cart];

    if (CreatedBerore >= 0) {
            newAmount = this.cart[CreatedBerore].amount + amount;
            updatedCartItems[CreatedBerore].amount = newAmount;
    } else {
        updatedCartItems.push({
            product: prodductId,
            amount: amount,
            unit: unit,
            path:ref
        });
    }
    this.cart = updatedCartItems;
    return this.save();
}

clientSchema.methods.removeFromCart = function (cartItemId) {
    const updatedCartItems = this.cart.filter(item => {
        return item._id.toString() !== cartItemId.toString();
    });
    this.cart = updatedCartItems;
    return this.save();
};

module.exports = mongoose.model('client', clientSchema);