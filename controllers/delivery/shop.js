
const Pay = require('../../models/pay');
const Offer = require('../../models/offer');
const e = require('express');

exports.getHome = async (req, res, next) => {

    const page = req.query.page || 1;
    const filter = Number(req.query.filter) || 1;
    const productPerPage = 10;
    let data;
    let total;
    let orderIdS = [];


    try {

        if (filter == 1) {

            const pay = await Pay.find({deliver: false, cancel: false, refund:false });

            pay.forEach(i => {
                orderIdS.push(i.order._id);
            });


            total = await Offer.find({ selected: true, order: { $in: orderIdS }, banana_delivery:true }).countDocuments();

            data = await Offer.find({ selected: true, order: { $in: orderIdS } })
                .select('offerProducts order seller banana_delivery price createdAt') 
                .populate({
                    path: 'order', select: 'locationDetails.stringAdress arriveDate'
                })
                .populate({
                    path: 'offerProducts.product', select: 'name_en name_ar name'
                })
                .skip((page - 1) * productPerPage)
                .limit(productPerPage);
            
        } else if (filter == 2) {

            const pay = await Pay.find({deliver: true, cancel: false, refund:false });

            pay.forEach(i => {
                orderIdS.push(i.order._id);
            });


            total = await Offer.find({ selected: true, order: { $in: orderIdS }, banana_delivery:true }).countDocuments();

            data = await Offer.find({ selected: true, order: { $in: orderIdS } })
                .select('offerProducts order seller banana_delivery price createdAt') 
                .populate({
                    path: 'order', select: 'locationDetails.stringAdress arriveDate'
                })
                .populate({
                    path: 'offerProducts.product', select: 'name_en name_ar name'
                })
                .skip((page - 1) * productPerPage)
                .limit(productPerPage);

        }

        res.status(200).json({
            state: 1,
            data: data,
            total: total,
            message: `data in filter ${filter} and page ${page}`
        });


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getClientInfo = async (req, res, next) => {

    const offerId = req.params.offer ;

    try {
        let offer = await Offer.findOne({ _id: offerId })
            .select('order client')
            .populate({
                path: 'order',
                select: 'locationDetails location arriveDate'
            })
            .populate({
                path:   'client',
                select: 'name mobile image code'
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

        const pay = await Pay.findOne({offer:offer._id})
        .select('method'); 

        res.status(200).json({
            state: 1,
            data: {
                mobile: offer.order.locationDetails.mobile2,
                adress: offer.order.locationDetails.stringAdress,
                name: offer.client.name,
                location: offer.order.location,
                date: offer.order.arriveDate,
                payMathod:pay.method,
                accountMobile:offer.client.code + offer.client.mobile,
                image:offer.client.image
            },
            message: 'client details for delever order'
        });


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getSellerInfo = async (req, res, next) => {

    const offerId = req.params.offer ;

    try {

        let offer = await Offer.findOne({ _id: offerId })
            .select('seller -_id')
            .populate({
                path: 'seller',
                select: 'name mobile code image certificate.location certificate.avilable certificate.StringAdress rate'
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

        res.status(200).json({
            state: 1,
            data: offer  ,
            message: 'seller details for delever order'
        });


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}