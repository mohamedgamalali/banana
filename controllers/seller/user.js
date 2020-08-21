const Order = require('../../models/order');
const Offer = require('../../models/offer');
const Pay = require('../../models/pay');


exports.getMyOrders = async (req, res, next) => {
    const page   = req.query.page || 1 ;
    const filter = req.query.filter || 0 ;

    try {
        const pay    = await Pay.find({seller:req.userId,deliver:Boolean(filter)});
        const orderIdS = pay.filter(i=>{
            return i.order._id ;
        });

        console.log(orderIdS);

        const offers = await Offer.find({seller:req.userId,selected:true,order:{$in:orderIdS}});

        res.status(200).json({
            state:1,
            data:offers,
            message:`orders in page ${page} and filter ${filter}`
        });
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}