const { validationResult } = require('express-validator');

const Products = require('../../models/products');
const ClientProduct = require('../../models/clientProducts');
const Client = require('../../models/client');
const Order = require('../../models/order');

exports.getProducts = async (req, res, next) => {
    const catigory = req.params.catigoryId;
    const page = req.query.page || 1;
    const productPerPage = 10;
    const filter = req.body.filter || false;
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
                .sort({ createdAt: -1, orders: -1 })
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
            category:category,
            $or: [
              { name_en:  new RegExp(searchQ.trim(), 'i') },
              { name_ar:  new RegExp(searchQ.trim() , 'i') },
            ],
          }).countDocuments();
        const products = await Products.find({
            category:category,
            $or: [
              { name_en:  new RegExp(searchQ.trim() , 'i') },
              { name_ar:  new RegExp(searchQ.trim(), 'i') },
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
            error.state      = 5 ;
            throw error;
        }
        if (unit != 'kg' && unit != 'g' && unit != 'grain' && unit != 'Liter' && unit != 'Gallon' && unit != 'drzn' && unit != 'bag') {
            const error = new Error(`validation faild for unit not a key`);
            error.statusCode = 422;
            error.state      = 5 ;
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
            error.state      = 9 ;
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
            error.state      = 5 ;
            throw error;
        }
        const client = await Client.findById(req.userId).select('cart');
        if (!client) {
            const error = new Error(`client not found`);
            error.statusCode = 404;
            error.state      = 3 ;
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
            error.state      = 3 ;
            throw error;
        }

        res.status(200).json({
            state: 1,
            data: cart,
            message: `client's cart`
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
            error.state      = 5 ;
            throw error;
        }
        if (unit != 'kg' && unit != 'g' && unit != 'grain' && unit != 'Liter' && unit != 'Gallon' && unit != 'drzn' && unit != 'bag') {
            const error = new Error(`validation faild for unit not a key`);
            error.statusCode = 422;
            error.state      = 5 ;
            throw error;
        }
        const client = await Client.findById(req.userId).select('cart');

        if (!client) {
            const error = new Error(`client not found`);
            error.statusCode = 404;
            error.state      = 3 ;
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
            data: {
                cart: updatedUSer.cart
            },
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
            error.state      = 5 ;
            throw error;
        }

        const client = await Client.findById(req.userId);
        const product = await Products.findById(productId);
        if (!client) {
            const error = new Error(`client not found`);
            error.statusCode = 404;
            error.state      = 3 ;
            throw error;
        }
        if (!product) {
            const error = new Error(`product not found`);
            error.statusCode = 404;
            error.state      = 9 ;
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

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state      = 5 ;
            throw error;
        }

        const client = await Client.findById(req.userId);
        if (!client) {
            const error = new Error(`client not found`);
            error.statusCode = 404;
            error.state      = 3 ;
            throw error;
        }
        const updatedUser = await client.addFevList(ListName);
        res.status(201).json({
            state: 1,
            data: {
                fevProducts: updatedUser.fevProducts
            },
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
            error.state      = 5 ;
            throw error;
        }

        const client = await Client.findById(req.userId).select('fevProducts');
        const updatedClient = await client.deleteFev(productId, listId);
        res.status(200).json({
            state: 1,
            data: {
                client: updatedClient.fevProducts
            },
            message: "deleted"
        })

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postAddOrder = async (req, res, next) => {
    const long = req.body.long;
    const lat = req.body.lat;
    const stringAdress = req.body.stringAdress;
    const arriveDate = req.body.arriveDate || 0;
    let category = [];
    let cart     = []; 

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state      = 5 ;
            throw error;
        }
        const client = await Client.findById(req.userId).select('cart').populate('cart.product');
        if (!client) {
            const error = new Error(`client not found`);
            error.statusCode = 404;
            error.state      = 3 ;
            throw error;
        }
        if (client.cart.length == 0) {
            const error = new Error(`validation faild cart in empty`);
            error.statusCode = 422;
            error.state      = 10 ;
            throw error;
        }

        client.cart.forEach(i => {
            category.push(i.product.category);
            cart.push({
                product: i.product._id,
                amount: i.amount,
                unit: i.unit,
                path: i.path
            })
        });

        var uniqueCategory = category.filter((value, index, self) => {
            return self.indexOf(value) === index;
        });

        const newOrder = new Order({
            client: client._id,
            category: uniqueCategory,
            products: cart,
            location: {
                type: "Point",
                coordinates: [long, lat]
            },
            arriveDate:arriveDate,
            stringAdress: stringAdress
        });
        await newOrder.save();

        //clear client cart
        client.cart = [];
        await client.save();

        res.status(201).json({
            state: 1,
            data: {
                order: newOrder
            },
            message: "order created"
        });


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}




