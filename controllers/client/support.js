const { validationResult } = require('express-validator');

const Order = require('../../models/order');
const Offer = require('../../models/offer');
const Issue = require('../../models/issues');
const IssueResons = require('../../models/issue-reason');
const SupportMessage = require('../../models/supportMessages');
const Policy = require('../../models/policy');
const Conditions               = require('../../models/conditions');


// const newI = new IssueResons({
//     reason_ar:'سسس',
//     reason_en:'rr'
// });

// newI.save()
// .then(i=>{
//     console.log(i);
// })
// .catch(err=>{
//     console.log(err);
// })

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
        
        const order = await Order.findById(orderId);
        if (!order) {
            const error = new Error(`order not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }
        if(order.client._id != req.userId){
            const error = new Error(`not the order owner`);
            error.statusCode = 403;
            error.state = 11;
            throw error;
        }
        if (order.status != 'ended') {
            const error = new Error(`wanna put issue for not ended order`);
            error.statusCode = 422;
            error.state = 14;
            throw error;
        }
        
        const offer = await Offer.findOne({order:order._id,selected:true,status:'ended'}).select('seller');

        if(!offer){
            const error = new Error(`can't find selected offer for the order`);
            error.statusCode = 404;
            error.state = 24;
            throw error;
        }

        const checkIssue = await Issue.findOne({order:order._id,client:req.userId});
        if(checkIssue){
            const error = new Error(`issue allready creted`);
            error.statusCode = 409;
            error.state = 25;
            throw error;
        }

        const re = await IssueResons.findById(reason);
        if(!re){
            const error = new Error(`reason not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }
        let temp ;
        if (image.length > 0) {
            image.forEach(element => {
                imageUrl.push(element.path);
            });    
            temp = {
                client: req.userId,
                order: order._id,
                reason: reason,
                demands: demands,
                imageUrl: imageUrl,
                seller:offer.seller._id,
                offer:offer._id
            };
        }else{
            temp = {
                client: req.userId,
                order: order._id,
                reason: reason,
                demands: demands,
                seller:offer.seller._id,
                offer:offer._id
            };
        }

        const issue = new Issue(temp);
        const iii     = await issue.save();

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


exports.getIssueReasons = async (req, res, next) => {

    

    try {
        const issuesReson = await IssueResons.find({});

        res.status(200).json({
            state:1,
            data:issuesReson,
            message:'issue reasons'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        console.log(err);
        next(err);
    }
}

//policy 
exports.getPolicy = async (req, res, next) => {
    
    
    try {
        
        const policy = await Policy.findOne({});
        
        res.status(200).json({
            state:1,
            data:policy,
            message:'policy'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

//conditions
exports.getConditions = async (req, res, next) => {
    
    
    try {
        
        const conditions = await Conditions.findOne({});
        
        res.status(200).json({
            state:1,
            data:conditions
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};