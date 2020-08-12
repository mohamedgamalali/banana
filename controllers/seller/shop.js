const Seller = require('../../models/seller');
const Order = require('../../models/order');


exports.getHome = async (req, res, next) => {

    try {
        const seller = await Seller.findById(req.userId).select('category');

        res.status(200).json({
            state: 1,
            data: seller.category,
            message: 'seller categories'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}

exports.getOrders = async (req, res, next) => {

    const page = req.query.page || 1;
    const long = req.query.long || false;
    const lat  = req.query.lat  || false; 
    const date = req.query.date || 0;
    const amount = req.query.amount || 0;

    const productPerPage = 10;
    let finalOrders = [];
    let find = {};
    let cord = false ;
    let orders ;

    try {
        if(lat && long){
            cord = [Number(long),Number(lat)] ;
        }
        if (!cord) {
            find = {
                category: { $in: req.sellerCat },
                status: 'started'
            }
        } else{
            find = {
                category: { $in: req.sellerCat },
                status: 'started',
                location: {
                    $near: {
                        $maxDistance: 1000 * 100,
                        $geometry: {
                            type: "Point",
                            coordinates: cord
                        }
                    }
                }
            }
        }

        if(date==0&&amount==0){
            orders = await Order.find(find)
            .select('location category client products')
            .populate({path:'products.product',select:'category name_en name_ar '})
        }else if(date==1&&amount==0){
            orders = await Order.find(find)
            .select('location category client products')
            .populate({path:'products.product',select:'category name_en name_ar '})
            .sort({createdAt:-1});
        }else if(date==0&&amount==1){
            orders = await Order.find(find)
            .select('location category client products')
            .populate({path:'products.product',select:'category name_en name_ar '})
            .sort({amount_count:-1});
        }else if(date==1&&amount==1){
            orders = await Order.find(find)
            .select('location category client products')
            .populate({path:'products.product',select:'category name_en name_ar '})
            .sort({amount_count:-1});
        }
        

        orders.forEach(element => {
            if (element.category.every(v => req.sellerCat.includes(v))) {
                finalOrders.push(element)
            }
        });

        res.status(200).json({
            state: 1,
            data: finalOrders.slice((page - 1) * productPerPage, productPerPage + 1),
            total: finalOrders.length,
            message: `orders in ${page} and ${long} and ${lat}`
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}