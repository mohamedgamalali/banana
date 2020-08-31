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
        const cat = [];
        req.sellerCat.forEach(i => {
            cat.push(i.name)
        });
        order.category.forEach(i => {
            const index = cat.indexOf(i);
            if (req.sellerCat[index].certificate.image == '0') {
                const error = new Error(`you should provide certificate for order category`);
                error.statusCode = 403;
                error.state = 27;
                throw error;
            }
            if (req.sellerCat[index].certificate.image != '0'
                && req.sellerCat[index].certificate.expiresAt != 0
                && req.sellerCat[index].certificate.state != 'approve') {
                const error = new Error(`one or more of the order category is under review or disapproved`);
                error.statusCode = 403;
                error.state = 28;
                throw error;
            }
            if (req.sellerCat[index].certificate.image != '0'
                && req.sellerCat[index].certificate.expiresAt != 0
                && req.sellerCat[index].certificate.state == 'approve'
                && req.sellerCat[index].activated == false) {
                const error = new Error(`certificate expired`);
                error.statusCode = 403;
                error.state = 29;
                throw error;
            }
        });
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

        const offer = new Offer({
            order: order._id,
            client: order.client,
            seller: req.userId,
            banana_delivery: banana_delivery,
            price: Number(price),
            offerProducts: offerProducts
        });

        await offer.save();

        res.status(201).json({
            state: 1,
            message: 'offer created'
        });

    } catch (err) {
        console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}
