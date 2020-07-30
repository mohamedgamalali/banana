const { validationResult } = require('express-validator');

const Products = require('../../models/products');
const Client = require('../../models/client');

exports.getProducts = async (req, res, next) => {
    const catigory = req.params.catigoryId;
    const page = req.query.page || 1;
    const productPerPage = 10;
    const filter = req.query.filter || "0";
    const date = req.query.date  || "0";
    const sold = req.query.sold || "0";
    let totalProducts;
    let products;
    let find = {};

    try {
        if(filter=='0'){
            find = { category: catigory}
        }else{
            find = { category: catigory ,productType:{$in:filter} }
        }
        if(date=='1'&&sold=='0'){
            totalProducts  = await Products.find(find).countDocuments();
            products = await Products.find(find)
            .sort({createdAt:-1})
            .skip((page - 1) * productPerPage)
            .limit(productPerPage);
        }else if(date=='1'&&sold=='1'){
            totalProducts  = await Products.find(find).countDocuments();
            products = await Products.find(find)
            .sort({createdAt:-1,orders:-1})
            .skip((page - 1) * productPerPage)
            .limit(productPerPage);
        }else if(date=='0'&&sold=='1'){
            totalProducts  = await Products.find(find).countDocuments();
            products = await Products.find(find)
            .sort({orders:-1})
            .skip((page - 1) * productPerPage)
            .limit(productPerPage);
        }
        

        res.status(200).json({
            state:1,
            data:{
                products:products
            },
            totalProducts:totalProducts,
            message:`products in page ${page}, filter ${filter}, date ${date} and sold ${sold}`
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postAddToCart = async (req, res, next) => {
    const productId = req.body.productId ;
    const unit = req.body.unit ;
    const amount = req.body.amount ;
    const errors = validationResult(req);

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            throw error;
        }
        if(unit!='kg' && unit!='g'&& unit!='grain'&& unit!='Liter'&&unit!= 'Gallon'&& unit!='drzn' && unit!='bag'){
            const error = new Error(`validation faild for unit not a key`);
            error.statusCode = 422;
            throw error;
        }
        const client      = await Client.findById(req.userId).populate('cart');
        const product     = await Products.findById(productId).select('orders');
        if(!product){
            const error = new Error(`product not found`);
            error.statusCode = 404;
            throw error;
        }
        const updatedUSer = await client.addToCart(productId,Number(amount),unit);
        product.orders +=1 ;
        await product.save();

        res.status(201).json({
            state:1,
            data:{
                cart:updatedUSer.cart
            },
            message:'added to cart'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.deleteCart = async (req, res, next) => {
    const cartItemId = req.body.cartItemId ;
    const errors = validationResult(req);

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            throw error;
        }
        const client = await Client.findById(req.userId).select('cart');
        if(!client){
            const error = new Error(`client not found`);
            error.statusCode = 404;
            throw error;
        }
        const updatedClient  = await client.removeFromCart(cartItemId);

        res.status(200).json({
            state:1,
            data:{
                cart:updatedClient.cart
            },
            message:'deleted form the cart'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}