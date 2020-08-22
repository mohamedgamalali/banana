const { validationResult } = require('express-validator');

const Seller = require('../../models/seller');
const Order = require('../../models/order');
const Offer = require('../../models/offer');


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
    const lat = req.query.lat || false;
    const date = req.query.date || 0;
    const amount = req.query.amount || 0;

    const productPerPage = 10;
    let finalOrders = [];
    let find = {};
    let cord = false;
    let orders;
    const cat = [] ;
    req.sellerCat.forEach(i=>{
        cat.push(i.name)
    });

    try {
        if (lat && long) {
            cord = [Number(long), Number(lat)];
        }
        if (!cord) {
            find = {
                category:{ $in: cat } ,
                status: 'started'
            }
        } else {
            find = {
                category:{ $in: cat } ,
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

        if (date == 0 && amount == 0) {
            orders = await Order.find(find)
                .select('location category client products amount_count stringAdress')
                .populate({ path: 'products.product',select: 'category name name_en name_ar'  })
        } else if (date == 1 && amount == 0) {
            orders = await Order.find(find)
                .select('location category client products amount_count stringAdress')
                .populate({ path: 'products.product',select: 'category name name_en name_ar' })
                .sort({ createdAt: -1 });
        } else if (date == 0 && amount == 1) {
            orders = await Order.find(find)
                .select('location category client products amount_count stringAdress')
                .populate({ path: 'products.product',select: 'category name name_en name_ar' })
                .sort({ amount_count: -1 });
        } else if (date == 1 && amount == 1) {
            orders = await Order.find(find)
                .select('location category client products amount_count stringAdress')
                .populate({ path: 'products.product', select: 'category name name_en name_ar' })
                .sort({ amount_count: -1 });
        }

        for (let element of orders) {
            if (element.category.every(v => cat.includes(v))) {
                const total_client_orders = await Order.find({ client: element.client._id }).countDocuments();
                const ended_client_orders = await Order.find({ client: element.client._id, status: 'ended' }).countDocuments();
                finalOrders.push({
                    order: element,
                    client: {
                        total_client_orders: total_client_orders,
                        ended_client_orders: ended_client_orders
                    }
                });
            }
        }

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

exports.putOffer = async (req, res, next) => {
    const orderId = req.body.orderId;
    const price = req.body.price;
    const banana_delivery = req.body.banana_delivery;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        const order = await Order.findById(orderId);
        if (!order) {
            const error = new Error(`order not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }
        order.category.forEach(i=>{
            const index = req.sellerCat['name'].indexOf(i);
            console.log(index);
        });
        if (order.status == 'endeed' || order.status == 'cancel') {
            const error = new Error(`order ended or canceled`);
            error.statusCode = 404;
            error.state = 12;
            throw error;
        }
        const ifOffer = await Offer.findOne({seller:req.userId,order:order._id});

        if(ifOffer){
            const error = new Error(`seller can't add more than offer for the same order`);
            error.statusCode = 409;
            error.state = 23;
            throw error;
        }

        const offer = new Offer({
            order: order._id,
            client: order.client,
            seller: req.userId,
            banana_delivery: banana_delivery,
            price: Number(price)
        });

        await offer.save();

        res.status(201).json({
            state: 1,
            message: 'offer created'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}
