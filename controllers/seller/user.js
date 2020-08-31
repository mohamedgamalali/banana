const Offer = require('../../models/offer');
const Pay = require('../../models/pay');
const Seller = require('../../models/seller');
const crypto = require('crypto');

const bycript = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');


exports.getMyOrders = async (req, res, next) => {
    const page = req.query.page || 1;
    const filter = Number(req.query.filter) || 0;
    let orderIdS = [];
    const offerPerPage = 10;

    try {
        const pay = await Pay.find({ seller: req.userId, deliver: Boolean(filter), cancel: false });
        console.log(pay);
        pay.forEach(i => {
            orderIdS.push(i.order._id);
        });

        console.log(orderIdS);

        const total = await Offer.find({ seller: req.userId, selected: true, order: { $in: orderIdS } }).countDocuments();

        const offers = await Offer.find({ seller: req.userId, selected: true, order: { $in: orderIdS } })
            .select('order seller banana_delivery price createdAt')
            .populate({
                path: 'order', select: 'products locationDetails.stringAdress arriveDate',
                populate: {
                    path: 'products.product',
                    select: 'name_en name_ar name',
                }
            })
            .skip((page - 1) * offerPerPage)
            .limit(offerPerPage);

        res.status(200).json({
            state: 1,
            data: offers,
            total: total,
            message: `orders in page ${page} and filter ${filter}`
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}

exports.getSingleOrderDetails = async (req, res, next) => {
    const offerId = req.params.offer;
    try {

        const offer = await Offer.findOne({ _id: offerId, seller: req.userId })
            .select('order client')
            .populate({
                path: 'order',
                select: 'locationDetails location'
            })
            .populate({
                path: 'client',
                select: 'mobile'
            });
        if (!offer) {
            const error = new Error(`offer not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }
        if (offer.selected == false) {
            const error = new Error(`client didn't select the seller's offer`);
            error.statusCode = 403;
            error.state = 21;
            throw error;
        }

        const pay = await Pay.findOne({ offer: offer._id, seller: req.userId, order: offer.order._id })
            .select('mobile adressString name');

        if (!pay) {
            const error = new Error(`some thing happend in client payment`);
            error.statusCode = 402;
            error.state = 22;
            throw error;
        }

        res.status(200).json({
            state: 1,
            deta: {
                mobile: [pay.mobile, offer.order.locationDetails.mobile2, offer.client.mobile],
                adress: [pay.adressString, offer.order.locationDetails.stringAdress],
                name: pay.name,
                location: offer.order.location
            },
            message: 'client details for delever order'
        })



    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}


exports.getMyOffers = async (req, res, next) => {
    const page = req.query.page || 1;
    const offerPerPage = 10;
    const filter = req.query.filter || 'started';
    let offer;
    let total;
    try {
        if (filter != 'ended') {
            offer = await Offer.find({ seller: req.userId, status: filter })
                .select('order banana_delivery price createdAt status')
                .sort({ createdAt: -1 })
                .populate({
                    path: 'order', select: 'products',
                    populate: {
                        path: 'products.product',
                        select: 'name_en name_ar name',
                    }
                })
                .skip((page - 1) * offerPerPage)
                .limit(offerPerPage);
            total = await Offer.find({ seller: req.userId, status: filter }).countDocuments();

        } else {
            offer = await Offer.find({ seller: req.userId, status: filter, selected: true })
                .select('order banana_delivery price createdAt status')
                .sort({ createdAt: -1 })
                .populate({
                    path: 'order', select: 'products',
                    populate: {
                        path: 'products.product',
                        select: 'name_en name_ar name',
                    }
                })
                .skip((page - 1) * offerPerPage)
                .limit(offerPerPage);
            total = await Offer.find({ seller: req.userId, status: filter, selected: true }).countDocuments();
        }

        res.status(200).json({
            state: 1,
            data: offer,
            total: total,
            message: `offers in page ${page} and filter ${filter}`
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

        const seller = await Seller.findById(req.userId).select('name');

        seller.name = name;

        const updatedSeller = await seller.save();

        res.status(200).json({
            state: 1,
            data: updatedSeller.name,
            message: 'seller name changed'
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
    let token;
    let message = 'password changed';

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const seller = await Seller.findById(req.userId).select('password');

        const isEqual = await bycript.compare(oldPassword, seller.password);
        if (!isEqual) {
            const error = new Error('wrong password');
            error.statusCode = 401;
            error.state = 8;
            throw error;
        }

        const isEqualNew = await bycript.compare(password, seller.password);

        if (isEqualNew) {
            const error = new Error('new password must be defferent from old password');
            error.statusCode = 409;
            error.state = 15;
            throw error;
        }

        const hashedPass = await bycript.hash(password, 12);

        seller.password = hashedPass;
        //logout from other devices

        if (logout) {
            seller.updated = Date.now().toString();
        }

        const updatedClient = await seller.save();

        if (logout) {
            token = jwt.sign(
                {
                    mobile: updatedClient.mobile,
                    userId: updatedClient._id.toString(),
                    updated: updatedClient.updated.toString()
                },
                process.env.JWT_PRIVATE_KEY_SELLER
            );
            message += ' and loged out from other devices';
        }

        res.status(200).json({
            state: 1,
            data: token,
            message: message
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}



exports.postAddCertificate = async (req, res, next) => {

    const expiresAt = Number(req.body.expiresAt);
    const StringAdress = req.body.StringAdress;
    const long = req.body.long1;
    const lat = req.body.lat1;
    const openFrom = req.body.openFrom;
    const openTo = req.body.openTo;

    const image = req.files;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        if (image.length == 0) {
            const error = new Error(`you shold insert image!!`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const seller = await Seller.findById(req.userId).select('category certificate');

        const updatedseller = await seller.addSert(image[0].path, expiresAt, long, lat, StringAdress, openFrom, openTo);

        res.status(201).json({
            state: 1,
            data: updatedseller.certificate,
            message: 'Certificate added'
        });


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.postAddCCategory = async (req, res, next) => {
    const name = req.body.name;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        if (name != 'F-V' && name != 'B' && name != 'F-M' && name != 'F') {
            const error = new Error(`validation faild for category in body.. not allowed value`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const seller = await Seller.findById(req.userId).select('category');

        const updatedseller = await seller.addCategory(name);

        res.status(201).json({
            state: 1,
            data: updatedseller.category,
            message: 'category added'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postDeleteCategory = async (req, res, next) => {
    
    const name = req.body.name;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }


        const seller = await Seller.findById(req.userId).select('category');

        const updatedseller = await seller.deleteCategory(name);

        res.status(201).json({
            state: 1,
            data: updatedseller.category,
            message: 'category added'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

//notfications
exports.postManageSendNotfication = async (req, res, next) => {
    const action = req.body.action;

    const errors = validationResult(req);
    try {

        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        const seller = await Seller.findById(req.userId).select('sendNotfication');

        seller.sendNotfication = action;

        const updatedSeller = await seller.save();

        res.status(200).json({
            state: 1,
            message: `notfication action ${updatedSeller.sendNotfication}`
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}



//mobile
exports.postEditMobile = async (req, res, next) => {

    const mobile = req.body.mobile;
    const code = req.body.code;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const seller = await Seller.findById(req.userId).select('mobile tempMobile tempCode');
        const checkClient = await Seller.findOne({ mobile: mobile });

        if (checkClient) {
            const error = new Error(`This user is already registered with mobile`);
            error.statusCode = 409;
            error.state = 6;
            throw error;
        }
        if (mobile == seller.mobile) {
            const error = new Error('new mobile must be defferent from old mobile');
            error.statusCode = 409;
            error.state = 16;
            throw error;
        }

        seller.tempMobile = mobile;
        seller.tempCode = code;

        const updatedClient = await seller.save();

        res.status(200).json({
            state: 1,
            data: updatedClient.tempCode + updatedClient.tempMobile,
            message: 'mobile changed'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postSendSMS = async (req, res, next) => {

    try {
        const seller = await Seller.findById(req.userId);

        const buf = crypto.randomBytes(3).toString('hex');
        const hashedCode = await bycript.hash(buf, 12)
        seller.verficationCode = hashedCode;
        seller.codeExpireDate = Date.now() + 3600000;

        const message = `your verification code is ${buf}`;

        //const {body,status} = await SMS.send(seller.tempCode + seller.tempMobile,message);

        await seller.save();

        res.status(200).json({
            state: 1,
            //data:body,
            code: buf,
            message: 'code sent'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postCheckCode = async (req, res, next) => {
    const code = req.body.code;

    const errors = validationResult(req);

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        const seller = await Seller.findById(req.userId).select('verficationCode codeExpireDate tempMobile mobile tempCode code');

        const isEqual = bycript.compare(code, seller.verficationCode);

        if (!isEqual) {
            const error = new Error('wrong code!!');
            error.statusCode = 403;
            error.state = 36;
            throw error;
        }
        if (seller.codeExpireDate <= Date.now()) {
            const error = new Error('verfication code expired');
            error.statusCode = 403;
            error.state = 37;
            throw error;
        }

        seller.mobile = seller.tempMobile;
        seller.code = seller.tempCode;
        const updatedClient = await seller.save();

        res.status(200).json({
            state: 1,
            data: updatedClient.code + updatedClient.mobile,
            messaage: 'mobile changed'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}
