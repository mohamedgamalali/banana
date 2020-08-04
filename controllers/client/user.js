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