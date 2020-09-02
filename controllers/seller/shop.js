const { validationResult } = require('express-validator');

const Seller = require('../../models/seller');
const Order = require('../../models/order');
const Offer = require('../../models/offer');
const Pay = require('../../models/pay');
const ScadPay = require('../../models/seller-sccad-pay');

const schedule = require('node-schedule');


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
    const filter = req.query.filter || 0;    //0=>for date //1=>amount //2=>location


    const productPerPage = 10;
    let finalOrders = [];
    let orders;
    const cat = [];

    try {


        if (filter == 2) {
            if (req.sellerCert.location.coordinates.length == 0) {
                const error = new Error(`you should provide certifecate`);
                error.statusCode = 403;
                error.state = 27;
                throw error;
            }
            orders = await Order.find({
                category: { $in: req.sellerCat },
                status: 'started',
                location: {
                    $near: {
                        $maxDistance: 1000 * 100,
                        $geometry: {
                            type: "Point",
                            coordinates: req.sellerCert.location.coordinates
                        }
                    }
                }
            })
                .select('location category client products amount_count stringAdress')
                .populate({ path: 'products.product', select: 'category name name_en name_ar' })
        } else if (filter == 0) {
            orders = await Order.find({
                category: { $in: req.sellerCat },
                status: 'started'
            })
                .select('location category client products amount_count stringAdress')
                .populate({ path: 'products.product', select: 'category name name_en name_ar' })
                .sort({ createdAt: -1 });
        } else if (filter == 1) {
            orders = await Order.find({
                category: { $in: req.sellerCat },
                status: 'started'
            })
                .select('location category client products amount_count stringAdress')
                .populate({ path: 'products.product', select: 'category name name_en name_ar' })
                .sort({ amount_count: -1 });
        }
        for (let element of orders) {
            if (element.category.every(v => req.sellerCat.includes(v))) {
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
            message: `orders in ${page} and filter ${filter}`
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
    const amount = req.body.amountArray;
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
        if (amount.length != order.products.length) {
            const error = new Error(`validation faild for amount ..not equal order products length`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }



        if ((!req.sellerCert.image)||(req.sellerCert.image.length==0)) {
            const error = new Error(`you should provide certificate for order category`);
            error.statusCode = 403;
            error.state = 27;
            throw error;
        }
        if (req.sellerCert.review == false || req.sellerCert.state != 'approve') {
            const error = new Error(`one or more of the order category is under review or disapproved`);
            error.statusCode = 403;
            error.state = 28;
            throw error;
        }
        if ((req.sellerCert.expiresAt != 0 && req.sellerCert.state == 'approve' && req.sellerCert.activated == false)
            || new Date(req.sellerCert.expiresAt).getTime() < new Date().getTime()) {
            const error = new Error(`certificate expired`);
            error.statusCode = 403;
            error.state = 29;
            throw error;
        }

        if (order.status == 'endeed' || order.status == 'cancel') {
            const error = new Error(`order ended or canceled`);
            error.statusCode = 404;
            error.state = 12;
            throw error;
        }
        const ifOffer = await Offer.findOne({ seller: req.userId, order: order._id });

        if (ifOffer) {
            const error = new Error(`seller can't add more than offer for the same order`);
            error.statusCode = 409;
            error.state = 23;
            throw error;
        }
        let offerProducts = [];

        amount.forEach((element, index) => {
            const f = order.products.find(i => i._id.toString() === element.cartItem.toString());
            if (!f) {
                const error = new Error(`cart item id not found for index ${index}`);
                error.statusCode = 404;
                error.state = 9;
                throw error;
            }
            let equals = true;
            if (f.amount > element.amount) {
                equals = false;
            }
            offerProducts.push({
                cartItem: element.cartItem,
                amount: element.amount,
                unit: f.unit,
                equals: equals
            });
        });
        const seller = await Seller.findById(req.userId).select('rate');

        const offer = new Offer({
            order: order._id,
            client: order.client,
            seller: req.userId,
            banana_delivery: banana_delivery,
            price: Number(price),
            offerProducts: offerProducts,
            location: req.sellerCert.location,
            sellerRate:seller.rate
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


//order arrive

exports.postOrderArrived = async (req, res, next) => {
    const orderId = req.body.orderId;


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
        if (order.status != 'ended') {
            const error = new Error(`order canceld or client haven't sellect yet `);
            error.statusCode = 403;
            error.state = 43;
            throw error;
        }
        const offer = await Offer.findOne({ seller: req.userId, order: order._id, selected: true });

        if (!offer) {
            const error = new Error(`no offer founded for the seller`);
            error.statusCode = 403;
            error.state = 44;
            throw error;
        }
        const pay = await Pay.findOne({ offer: offer._id, order: order._id, seller: req.userId })

        if (!pay) {
            const error = new Error(`payment required client didn't pay`);
            error.statusCode = 400;
            error.state = 41;
            throw error;
        }
        if (pay.deliver == true) {
            const error = new Error(`order allready deleverd`);
            error.statusCode = 409;
            error.state = 45;
            throw error;
        }
        if (pay.cancel == true) {
            const error = new Error(`order canceld by the user`);
            error.statusCode = 409;
            error.state = 46;
            throw error;
        }

        pay.deliver = true;
        pay.arriveIn = Date.now();

        if (pay.method != 'cash') {
            const seller = await Seller.findById(req.userId).select('bindingWallet');
            const minus = (offer.price * 5) / 100;

            seller.bindingWallet += (offer.price - minus);

            await seller.save() ;

        
        const newScad = new ScadPay({
            seller: req.userId ,
            fireIn: new Date().getTime() + 259200000 ,
            order:  order._id,
            price:offer.price - ((offer.price * 5) / 100)
        });

        const s = await newScad.save() ;
        schedule.scheduleJob(s._id.toString(),new Date().getTime() + 259200000 ,async function(){
            const seller = await Seller.findById(req.userId).select('wallet bindingWallet') ;
            if(seller.bindingWallet>=s.price){
                seller.bindingWallet = seller.bindingWallet - s.price ;
                seller.wallet       += s.price ;
                await seller.save() ;
                const sss  = await ScadPay.findById(s._id)
                sss.delever = true ; 
                await sss.save();
            }
            
        });

    }

        //saving

        await pay.save() ;

        res.status(201).json({
            state: 1,
            message: 'order arrived mony will be in wallet after 3 days'
        });

    } catch (err) {

        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}
