const Client = require('../../models/client');
const Order = require('../../models/order');

exports.getOrders = async (req, res, next) => {
    const page = req.query.page || 1;
    const productPerPage = 10;
    const filter = req.query.filter || 'started';
    try {
        const total  = await Order.find({client:req.userId,status:filter}).countDocuments();
        const orders = await Order.find({client:req.userId,status:filter})
        .select('location stringAdress arriveDate products')
        .populate({path:'products.product',select:'name name_en name_ar imageUrl'})
        .sort({ createdAt: -1 })
        .skip((page - 1) * productPerPage)
        .limit(productPerPage);

        res.status(200).json({
            state:1,
            data:{
                orders:orders
            },
            total:total,
            message:`orders in page ${page} sortder by date with filter ${filter}`
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postCancelOrder = async (req, res, next) => {
    const orderId = req.body.orderId;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            const error = new Error(`order not found`);
            error.statusCode = 404;
            error.state      = 9  ;
            throw error;
        }
        if (order.client.toString()!==req.userId.toString()) {
            const error = new Error('you are not the order owner!!');
            error.statusCode = 403;
            error.state      = 11 ;
            throw error;
        }
        if(order.status!='started'){
            const error = new Error('the order status != started');
            error.statusCode = 409;
            error.state      = 12 ;
            throw error;
        }
        await order.cancelOrder();

        res.status(200).json({
            state:1,
            message:'order canceled'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}