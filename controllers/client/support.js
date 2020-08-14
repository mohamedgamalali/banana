const { validationResult } = require('express-validator');

const Order = require('../../models/order');
const Issue = require('../../models/issues');
const SupportMessage = require('../../models/supportMessages');

const deleteFile = require("../../helpers/file");

exports.postIssue = async (req, res, next) => {

    const orderId = req.body.orderId;
    const reason = req.body.reason;
    const demands = req.body.demands;
    const image = req.files || [];
    const errors = validationResult(req);
    let imageUrl = [];
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        if (image.length == 0) {
            const error = new Error(`you shold insert one image at least!!`);
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
        if (order.status != 'started') {
            const error = new Error(`wanna put issue for not ended order`);
            error.statusCode = 422;
            error.state = 14;
            throw error;
        }
        image.forEach(element => {
            imageUrl.push(element.path);
        });

        const issue = new Issue({
            client: req.userId,
            order: order._id,
            reason: reason,
            demands: demands,
            imageUrl: imageUrl
        });
        const i = await issue.save();

        //seller id must be added

        res.status(201).json({
            state: 1,
            message: 'issue created'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        next(err);
    }
}

exports.postContactUs = async (req, res, next) => {

    const name = req.body.name;
    const email = req.body.email;
    const message = req.body.message;

    const errors = validationResult(req);

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const mm = new SupportMessage({
            name: name,
            email: email,
            message: message,
            user:req.userId,
            user_type:'client'
        });

        const m = await mm.save(); 

        res.status(201).json({
            state:1,
            message:'support message sent'
        });
        

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        console.log(err);
        next(err);
    }
}