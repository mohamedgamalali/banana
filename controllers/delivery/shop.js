
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