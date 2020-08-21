const Order = require('../../models/order');
const Offer = require('../../models/offer');
const Pay = require('../../models/pay');
const e = require('express');



exports.getMyOrders = async (req, res, next) => {
    const page = req.query.page || 1;
    const filter = Number(req.query.filter) || 0;
    let orderIdS = [];
    const offerPerPage = 10;

    try {
        const pay = await Pay.find({ seller: req.userId, deliver: Boolean(filter) });
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
    const offerPerPage = 10 ;
    const filter = req.query.filter || 'started';
    let offer;
    let total;
    try {
        if (filter != 'ended') {
            offer = await Offer.find({seller:req.userId,status:filter})
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
            total =  await Offer.find({seller:req.userId,status:filter}).countDocuments();

        } else {
            offer = await Offer.find({seller:req.userId,status:filter,selected:true})
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
            total =  await Offer.find({seller:req.userId,status:filter,selected:true}).countDocuments();
        }

        res.status(200).json({
            state:1,
            data:offer,
            total:total,
            message:`offers in page ${page} and filter ${filter}`
        });


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}