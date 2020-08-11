const Seller = require('../../models/seller');
const Order = require('../../models/order');


exports.getHome = async (req, res, next) => {
    
    try {
        const seller = await Seller.findById(req.userId).select('category');

        res.status(200).json({
            state:1,
            data:seller.category,
            message:'seller categories'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}

exports.getOrders = async (req, res, next) => {
    
    try {
        
        const orders = await Order.find({category:{$all:['F-V','F-M','F']}});
        console.log(req.userId);

       

        res.status(200).json({
            state:1,
            data:orders,
            message:'orders'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}