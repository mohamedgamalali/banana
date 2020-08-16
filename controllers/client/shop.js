const { validationResult } = require('express-validator');
const https = require('https');
const querystring = require('querystring');

const Products = require('../../models/products');
const ClientProduct = require('../../models/clientProducts');
const Client = require('../../models/client');
const Order = require('../../models/order');
const Location = require('../../models/location');
const Offer = require('../../models/offer');

const pay = require('../../helpers/pay');

exports.getProducts = async (req, res, next) => {
    const catigory = req.params.catigoryId;
    const page = req.query.page || 1;
    const productPerPage = 10;
    const filter = req.query.filter || false;
    const date = req.query.date || "0";
    const sold = req.query.sold || "0";
    let totalProducts;
    let products;
    let find = {};

    try {
        if (!filter) {
            find = { category: catigory }
        } else {
            find = { category: catigory, productType: { $in: filter } }
        }
        if (date == '1' && sold == '0') {
            totalProducts = await Products.find(find).countDocuments();
            products = await Products.find(find)
                .sort({ createdAt: -1 })
                .skip((page - 1) * productPerPage)
                .limit(productPerPage)
                .select('category name_en name_ar productType imageUrl');
        } else if (date == '1' && sold == '1') {
            totalProducts = await Products.find(find).countDocuments();
            products = await Products.find(find)
                .sort({ orders: -1, createdAt: -1 })
                .skip((page - 1) * productPerPage)
                .limit(productPerPage)
                .select('category name_en name_ar productType imageUrl');
        } else if (date == '0' && sold == '1') {
            totalProducts = await Products.find(find).countDocuments();
            products = await Products.find(find)
                .sort({ orders: -1 })
                .skip((page - 1) * productPerPage)
                .limit(productPerPage)
                .select('category name_en name_ar productType imageUrl');
        } else if (date == '0' && sold == '0') {
            totalProducts = await Products.find(find).countDocuments();
            products = await Products.find(find)
                .skip((page - 1) * productPerPage)
                .limit(productPerPage)
                .select('category name_en name_ar productType imageUrl');
        }


        res.status(200).json({
            state: 1,
            data: products,
            total: totalProducts,
            message: `products in page ${page}, filter ${filter}, date ${date} and sold ${sold}`
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getSearch = async (req, res, next) => {

    const page = req.query.page || 1;
    const productPerPage = 10;
    const searchQ = req.query.searchQ;
    const category = req.params.catigoryId;

    try {

        const totalItems = await Products.find({
            category: category,
            $or: [
                { name_en: new RegExp(searchQ.trim(), 'i') },
                { name_ar: new RegExp(searchQ.trim(), 'i') },
            ],
        }).countDocuments();
        const products = await Products.find({
            category: category,
            $or: [
                { name_en: new RegExp(searchQ.trim(), 'i') },
                { name_ar: new RegExp(searchQ.trim(), 'i') },
            ],
        })
            .select('category name_en name_ar productType imageUrl')
            .skip((page - 1) * productPerPage)
            .limit(productPerPage);

        res.status(200).json({
            state: 1,
            data: products,
            total: totalItems,
            message: `products with ur search (${searchQ})`
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postAddToCart = async (req, res, next) => {
    const productId = req.body.productId;
    const unit = req.body.unit;
    const amount = req.body.amount;
    const newProduct = req.body.newProduct || false;
    const errors = validationResult(req);
    let ref = 'product';
    let product;

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        if (unit != 'kg' && unit != 'g' && unit != 'grain' && unit != 'Liter' && unit != 'Gallon' && unit != 'drzn' && unit != 'bag') {
            const error = new Error(`validation faild for unit not a key`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        if (newProduct) {
            product = await ClientProduct.findById(productId);
            ref = 'clientProducts';
        } else {
            product = await Products.findById(productId);
        }
        const client = await Client.findById(req.userId).populate('cart');
        if (!product) {
            const error = new Error(`product not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }
        const updatedUSer = await client.addToCart(productId, Number(amount), unit, ref);

        res.status(201).json({
            state: 1,
            data: updatedUSer.cart,
            message: 'added to cart'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.deleteCart = async (req, res, next) => {
    const cartItemId = req.body.cartItemId;
    const errors = validationResult(req);

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        const client = await Client.findById(req.userId).select('cart')
            .populate({
                path: 'cart.product',
                select: 'category name_en name_ar imageUrl name'
            });
        if (!client) {
            const error = new Error(`client not found`);
            error.statusCode = 404;
            error.state = 3;
            throw error;
        }
        const updatedClient = await client.removeFromCart(cartItemId);

        res.status(200).json({
            state: 1,
            data: updatedClient.cart,
            message: 'deleted form the cart'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getCart = async (req, res, next) => {


    try {
        const cart = await Client.findById(req.userId)
            .select('cart')
            .populate({
                path: 'cart.product',
                select: 'category name_en name_ar imageUrl name'
            });
        if (!cart) {
            const error = new Error(`client not found`);
            error.statusCode = 404;
            error.state = 3;
            throw error;
        }

        const location = await Location.find({ client: req.userId }).select('Location name mobile stringAdress ');


        res.status(200).json({
            state: 1,
            data: cart.cart,
            location: location,
            message: `client's cart with location`
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postAddToCartFood = async (req, res, next) => {
    const name = req.body.name;
    const unit = req.body.unit;
    const amount = req.body.amount;
    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        if (unit != 'kg' && unit != 'g' && unit != 'grain' && unit != 'Liter' && unit != 'Gallon' && unit != 'drzn' && unit != 'bag') {
            const error = new Error(`validation faild for unit not a key`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        const client = await Client.findById(req.userId).select('cart');

        if (!client) {
            const error = new Error(`client not found`);
            error.statusCode = 404;
            error.state = 3;
            throw error;
        }

        const newProduct = new ClientProduct({
            category: 'F',
            name: name,
            client: client._id
        });

        const product = await newProduct.save();

        const updatedUSer = await client.addToCart(product._id, Number(amount), unit, 'clientProducts');

        res.status(201).json({
            state: 1,
            data: updatedUSer.cart,
            message: 'client product added to cart'
        })


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.postAddFev = async (req, res, next) => {
    const productId = req.body.productId;
    const listId = req.body.listId;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const client = await Client.findById(req.userId);
        const product = await Products.findById(productId);
        if (!client) {
            const error = new Error(`client not found`);
            error.statusCode = 404;
            error.state = 3;
            throw error;
        }
        if (!product) {
            const error = new Error(`product not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }

        await client.addToFev(productId, listId);


        res.status(201).json({
            state: 1,
            message: 'added to fevourite'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postAddFevList = async (req, res, next) => {
    const ListName = req.body.ListName;
    const send = [];
    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const client = await Client.findById(req.userId);
        if (!client) {
            const error = new Error(`client not found`);
            error.statusCode = 404;
            error.state = 3;
            throw error;
        }
        const updatedUser = await client.addFevList(ListName);
        updatedUser.fevProducts.forEach(i => {
            send.push({
                _id: i._id,
                name: i.list.name
            });
        })
        res.status(201).json({
            state: 1,
            data: send,
            message: 'list Created'
        })

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.deleteFev = async (req, res, next) => {
    const productId = req.body.productId;
    const listId = req.body.listId;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        console.log(req.userId);

        const client = await Client.findById(req.userId).select('fevProducts').populate('fevProducts.list.product');
        const updatedClient = await client.deleteFev(productId, listId);
        const ListProducts = updatedClient.fevProducts.filter(f => {
            return f._id.toString() === listId.toString();
        });

        const products = await Products.find({ _id: { $in: ListProducts[0].list.product } })
            .select('category name_en name_ar productType imageUrl');

        res.status(200).json({
            state: 1,
            data: products,
            message: "deleted"
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

//orders
exports.postAddOrder = async (req, res, next) => {
    const locationId = req.body.locationId;
    const arriveDate = req.body.arriveDate || 0;
    let category = [];
    let cart = [];
    let amount_count = 0;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        const client = await Client.findById(req.userId).select('cart').populate('cart.product');
        if (!client) {
            const error = new Error(`client not found`);
            error.statusCode = 404;
            error.state = 3;
            throw error;
        }
        if (client.cart.length == 0) {
            const error = new Error(`validation faild cart in empty`);
            error.statusCode = 422;
            error.state = 10;
            throw error;
        }

        client.cart.forEach(i => {
            category.push(i.product.category);
            cart.push({
                product: i.product._id,
                amount: i.amount,
                unit: i.unit,
                path: i.path
            });
            amount_count += i.amount;
        });

        var uniqueCategory = category.filter((value, index, self) => {
            return self.indexOf(value) === index;
        });
        const location = await Location.findById(locationId);
        if (!location) {
            const error = new Error(`location not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }
        const newOrder = new Order({
            client: client._id,
            amount_count: amount_count,
            category: uniqueCategory,
            products: cart,
            location: {
                type: "Point",
                coordinates: [location.Location.coordinates[0], location.Location.coordinates[1]]
            },
            arriveDate: arriveDate,
            locationDetails: {
                name: location.name,
                stringAdress: location.stringAdress,
                mobile2: location.mobile
            }
        });
        await newOrder.save();

        //clear client cart
        client.cart = [];
        await client.save();

        res.status(201).json({
            state: 1,
            message: "order created"
        });


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getSingleOrder = async (req, res, next) => {

    const orderId = req.params.id;

    try {
        const order = await Order.findById(orderId)
            .select('location locationDetails products arriveDate client')
            .populate({ path: 'products.product', select: 'name_en name_ar imageUrl' });

        if (order.client.toString() !== req.userId) {
            const error = new Error(`not the order owner`);
            error.statusCode = 403;
            error.state = 18;
            throw error;
        }

        res.status(200).json({
            state: 1,
            data: order,
            message: `order with id = ${orderId}`
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

//offers
exports.getOffers = async (req, res, next) => {

    const page = req.query.page || 1;
    const filter = req.query.filter || 1;
    const offerPerPage = 10;
    let offer;
    let totalOffer;

    try {
        if (filter == 1) {
            offer = await Offer.find({ client: req.userId, status: 'started' })
                .select('order seller banana_delivery price createdAt')
                .populate({
                    path: 'order', select: 'products',
                    populate: {
                        path: 'products.product',
                        select: 'name_en name_ar name',
                    }
                })
                .populate({ path: 'seller', select: 'rete' })
                .sort({ createdAt: -1 })
                .skip((page - 1) * offerPerPage)
                .limit(offerPerPage);

            totalOffer = await Offer.find({  client: req.userId, status: 'started' }).countDocuments();
        }else if (filter == 2) {
            offer = await Offer.find({ client: req.userId, status: 'started' })
                .select('order seller banana_delivery price createdAt')
                .populate({
                    path: 'order', select: 'products',
                    populate: {
                        path: 'products.product',
                        select: 'name_en name_ar name',
                    }
                })
                .populate({ path: 'seller', select: 'rete' })
                .sort({ price: 0})
                .skip((page - 1) * offerPerPage)
                .limit(offerPerPage);

            totalOffer = await Offer.find({ client: req.userId, status: 'started' }).countDocuments();
        }
        //filter for rating
        // else if (filter == 2) {
        //     offer = await Offer.find({ client: req.userId, status: 'started' })
        //         .select('order seller banana_delivery price createdAt')
        //         .populate({
        //             path: 'order', select: 'products',
        //             populate: {
        //                 path: 'products.product',
        //                 select: 'name_en name_ar name',
        //             }
        //         })
        //         .populate({ path: 'seller', select: 'rete' })
        //         .sort({ price: 0})
        //         .skip((page - 1) * offerPerPage)
        //         .limit(offerPerPage);

        //     totalOffer = await Offer.find({ client: req.userId }).countDocuments();
        // }


        res.status(200).json({
            state: 1,
            data: offer,
            total: totalOffer,
            message: `offers in page ${page} and filter = ${filter}`
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postCancelOffer = async (req, res, next) => {

    const offerId = req.body.offerId;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        const offer = await Offer.findById(offerId).select('client status');
        if (!offer) {
            const error = new Error(`offer not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }
        if (offer.client.toString() !== req.userId) {
            const error = new Error(`not the order owner`);
            error.statusCode = 403;
            error.state = 18;
            throw error;
        }

        await offer.cancel();

        res.status(200).json({
            state: 1,
            message: 'offer canceled'
        });


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

//offer pay 

exports.postPay = async (req, res, next) => {

    const offerId = req.body.offerId;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        var path = '/v1/checkouts';
        var data = querystring.stringify({
            'entityId': '8a8294174d0595bb014d05d82e5b01d2',
            'amount': '92.00',
            'currency': 'EUR',
            'paymentType': 'DB'
        });
        var options = {
            port: 443,
            host: 'https://test.oppwa.com',
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length,
                'Authorization': 'Bearer OGE4Mjk0MTc0ZDA1OTViYjAxNGQwNWQ4MjllNzAxZDF8OVRuSlBjMm45aA=='
            }
        };
        var postRequest = https.request(options, function (res) {
            console.log(res);
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                const jsonRes = JSON.parse(chunk);
                return cb(jsonRes);
            });
        });
        postRequest.on('error', (e) => {
            console.log("Error posting message: " + e);
        });
        postRequest.write(data);
        postRequest.end();

        res.status(200).json({
            state: 1
        })

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}