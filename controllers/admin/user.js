const { validationResult } = require("express-validator");
const schedule = require('node-schedule');
const path = require("path");

const Seller = require("../../models/seller");
const Scad = require("../../models/cert-expire");


exports.getCertificate = async (req, res, next) => {

    const page = req.query.page || 1;
    const productPerPage = 10;

    try {
        const seller = await Seller.find({ 'certificate.review' : false })
            .skip((page - 1) * productPerPage)
            .limit(productPerPage)
            .select('name mobile email category certificate');

        const total = await Seller.find({ 'certificate.review' : false }).countDocuments();

        res.status(200).json({
            state: 1,
            data: seller,
            total: total,
            message: 'Certificates need approve'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getSingleUserCertificates = async (req, res, next) => {

    const sellerId = req.params.sellerId;

    try {

        const seller = await Seller.findById(sellerId)
        .select('name mobile email category certificate');
        if (!seller) {
            const error = new Error('seller not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            state:1,
            data:seller,
            message:'all seller certificates'
        })


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};



exports.postApproveCertificate = async (req, res, next) => {

    const sellerId = req.body.sellerId;
  
    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            throw error;
        }
        
        const seller = await Seller.findById(sellerId).select('category certificate');
        if(!seller){
            const error = new Error('seller not found');
            error.statusCode = 404;
            throw error;
        }
        const updatedSeller = await seller.certApprove();
        
        schedule.scheduleJob(new Date(updatedSeller.certificate.expiresAt).getTime(),async(fireDate)=>{
            await updatedSeller.certExpired() ; 
        });

        await Scad.deleteOne({seller:seller._id});

        const newSchedule = new Scad({
            seller:updatedSeller._id,
            expiresin:updatedSeller.certificate.expiresAt
        });
        await newSchedule.save();

        res.status(200).json({
            state: 1,
            message: `certificate approved`,
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


exports.postDisapproveCertificate = async (req, res, next) => {

    const sellerId = req.body.sellerId;
    const adminNote = req.body.adminNote;

    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            throw error;
        }
        
        const seller = await Seller.findById(sellerId).select('category certificate');
        if(!seller){
            const error = new Error('seller not found');
            error.statusCode = 404;
            throw error;
        }
        const updatedSeller = await seller.certDisapprove(adminNote);
        
        
        res.status(200).json({
            state: 1,
            message: `certificate disapproved`,
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};