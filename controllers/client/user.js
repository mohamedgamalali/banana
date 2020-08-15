const bycript = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const io = require("../../socket.io/socket");

const Client = require('../../models/client');
const Order = require('../../models/order');
const Products = require('../../models/products');
const Locations = require('../../models/location');

exports.getOrders = async (req, res, next) => {
    const page = req.query.page || 1;
    const productPerPage = 10;
    const filter = req.query.filter || 'started';
    try {
        const total = await Order.find({ client: req.userId, status: filter }).countDocuments();
        const orders = await Order.find({ client: req.userId, status: filter })
            .select('location stringAdress arriveDate products locationDetails')
            .populate({ path: 'products.product', select: 'name name_en name_ar imageUrl' })
            .sort({ createdAt: -1 })
            .skip((page - 1) * productPerPage)
            .limit(productPerPage);

        res.status(200).json({
            state: 1,
            data: orders,
            total: total,
            message: `orders in page ${page} sortder by date with filter ${filter}`
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
        if (order.client.toString() !== req.userId.toString()) {
            const error = new Error('you are not the order owner!!');
            error.statusCode = 403;
            error.state = 11;
            throw error;
        }
        if (order.status != 'started') {
            const error = new Error('the order status != started');
            error.statusCode = 409;
            error.state = 12;
            throw error;
        }
        await order.cancelOrder();

        res.status(200).json({
            state: 1,
            message: 'order canceled'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getMyFevList = async (req, res, next) => {
    let list = [];
    try {
        const client = await Client.findById(req.userId).select('fevProducts');
        client.fevProducts.forEach(i => {
            list.push({
                _id: i._id,
                name: i.list.name
            });
        });

        res.status(200).json({
            state: 1,
            data: list,
            message: 'client fev lists'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getMyfevProducts = async (req, res, next) => {
    const listId = req.params.id;

    try {
        const client = await Client.findById(req.userId).select('fevProducts');


        const ListProducts = client.fevProducts.filter(f => {
            return f._id.toString() === listId.toString();
        });
        if (ListProducts.length == 0) {
            const error = new Error(`list not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }
        const products = await Products.find({ _id: { $in: ListProducts[0].list.product } })
            .select('category name_en name_ar productType imageUrl');
        res.status(200).json({
            state: 1,
            data: products,
            message: `products in list ${listId}`
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postEditName = async (req, res, next) => {
    const name = req.body.name;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const client = await Client.findById(req.userId).select('name');

        client.name = name;

        const updatedClient = await client.save();

        //start socket event
        io.getIO().emit("name", {
            action: "edit",
            userId: updatedClient._id,
            newName: updatedClient.name
        });

        res.status(200).json({
            state: 1,
            data: updatedClient.name,
            message: 'client name changed'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.postEditPassword = async (req, res, next) => {

    const oldPassword = req.body.oldPassword;
    const password = req.body.password;
    const logout = req.body.logout || false;
    let   token ;
    let message = 'password changed';

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const client = await Client.findById(req.userId).select('password');
        const isEqual = await bycript.compare(oldPassword, client.password);
        if (!isEqual) {
            const error = new Error('wrong password');
            error.statusCode = 401;
            error.state = 8;
            throw error;
        }

        const isEqualNew = await bycript.compare(password, client.password);
        if (isEqualNew) {
            const error = new Error('new password must be defferent from old password');
            error.statusCode = 409;
            error.state = 15;
            throw error;
        }

        const hashedPass = await bycript.hash(password, 12);

        client.password = hashedPass;
        //logout from other devices

        if (logout) {
            client.updated = Date.now().toString();
        }

        const updatedClient = await client.save();
        
        if(logout){
            token = jwt.sign(
                {
                    mobile: updatedClient.mobile,
                    userId: updatedClient._id.toString(),
                    updated:updatedClient.updated.toString()
                },
                process.env.JWT_PRIVATE_KEY_CLIENT
            );
            message += ' and loged out from other devices' ;
        }

        res.status(200).json({
            state: 1,
            data:token,
            message: message
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}



exports.postEditMobile = async (req, res, next) => {

    const mobile = req.body.mobile;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const client = await Client.findById(req.userId).select('mobile');
        if (mobile == client.mobile) {
            const error = new Error('new mobile must be defferent from old mobile');
            error.statusCode = 409;
            error.state = 16;
            throw error;
        }

        client.mobile = mobile;
        client.verfication = false;

        const updatedClient = await client.save();

        res.status(200).json({
            state: 1,
            data: updatedClient.mobile,
            message: 'mobile changed'
        })

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.postAddLocation = async (req, res, next) => {

    const mobile = req.body.mobile;
    const name = req.body.name;
    const stringAdress = req.body.stringAdress;
    const long = req.body.long1;
    const lat = req.body.lat1;

    const errors = validationResult(req);
    try {
        
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const newLoc = new Locations({
            client:req.userId,
            Location: {
                type: "Point",
                coordinates: [long, lat]
            },
            name:name,
            mobile:mobile,
            stringAdress:stringAdress
        });

        const loc = await newLoc.save();

        res.status(201).json({
            state:1,
            data:loc,
            message:'location added'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getLocations = async (req, res, next) => {

    
    try {
        const location = await Locations.find({client:req.userId}).select('Location name mobile stringAdress');

        res.status(200).json({
            state:1,
            data:location,
            message:'client locations'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.deleteLocation = async (req, res, next) => {
    const locationId = req.body.locationId ;

    const errors = validationResult(req);
    try {
        
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        const location = await Locations.findById(locationId);
        if(!location){
            const error = new Error(`location not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }

        await Locations.deleteOne({_id:location._id});

        const allLocations = await Locations.find({client:req.userId}).select('Location name mobile stringAdress');

        res.status(200).json({
            state:1,
            data:allLocations,
            message:'client locations'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

