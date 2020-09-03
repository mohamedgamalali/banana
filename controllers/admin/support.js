const { validationResult } = require("express-validator");
const Policy = require('../../models/policy');
const Conditions = require('../../models/conditions');
const SupportMessages = require('../../models/supportMessages');
const Issue = require('../../models/issues');
const IssueRwasons = require('../../models/issue-reason');

//policy
exports.getPolicy = async (req, res, next) => {


    try {

        const policy = await Policy.findOne({});

        res.status(200).json({
            state: 1,
            policy: policy
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.postAddPolicy = async (req, res, next) => {
    const errors = validationResult(req);
    const EN = req.body.EN;
    const AR = req.body.AR;

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild..${errors.array()[0].param} : ${errors.array()[0].msg}`);
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const policy = await Policy.findOne({});
        if (!policy) {
            const newPolicy = new Policy({
                EN: EN,
                AR: AR
            });
            await newPolicy.save()
        } else {
            policy.EN = EN;
            policy.AR = AR;
            await policy.save()
        }

        res.status(200).json({
            state: 1,
            message: 'added'
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
            state: 1,
            conditions: conditions
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.postConditions = async (req, res, next) => {
    const errors = validationResult(req);
    const EN = req.body.EN;
    const AR = req.body.AR;

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild..${errors.array()[0].param} : ${errors.array()[0].msg}`);
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const conditions = await Conditions.findOne({});
        if (!conditions) {
            const newConditions = new Conditions({
                EN: EN,
                AR: AR
            });
            await newConditions.save()
        } else {
            conditions.EN = EN;
            conditions.AR = AR;
            await conditions.save();
        }

        res.status(200).json({
            state: 1,
            message: 'added'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getSupportMessages = async (req, res, next) => {

    const page = req.query.page || 1;
    const productPerPage = 10;

    try {
        const total = await SupportMessages.find({}).countDocuments();
        const messages    = await SupportMessages.find({})
        .populate({path:'user',select:'name mobile email code'})
            .sort({ createdAt: -1 })
            .skip((page - 1) * productPerPage)
            .limit(productPerPage);
        
        res.status(200).json({
            state:1,
            data:messages,
            total:total,
            message:`support messages in page ${page}`
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

//issues
exports.getIssues = async (req, res, next) => {

    const page = req.query.page || 1;
    const reason = req.query.reason || false;

    const filter = req.query.filter || 'binding';
    const issuePerPage = 10;
    find = {} ;
    try {
        if(reason){
            find = {
                state: filter,
                reason:reason
            };
        }else{
            find = {
                state: filter
            };
        }

        const total = await Issue.find(find).countDocuments()
        const issues = await Issue.find(find)
            .sort({ createdAt: -1 })
            .skip((page - 1) * issuePerPage)
            .limit(issuePerPage)
            .select('order offer reason')
            .populate({
                path: 'order',
                select: 'products',
                populate: {
                    path: 'products.product',
                    select: 'name_ar name_en name'
                }
            })
            .populate({
                path: 'offer',
                select: 'banana_delivery price selected offerProducts'
            })
            .populate({
                path: 'reason',
                select: 'reason_ar reason_en'
            });

        res.status(200).json({
            state: 1,
            data: issues,
            total: total,
            message: `issues in page ${page} and filter ${filter}`
        })


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.postIssueReasons = async (req, res, next) => {

    const errors = validationResult(req);
    const EN = req.body.EN;
    const AR = req.body.AR;

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild..${errors.array()[0].param} : ${errors.array()[0].msg}`);
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const reason = new IssueRwasons({
            reason_ar:AR,
            reason_en:EN,
        });

        const newIssueReason = await reason.save();

        res.status(201).json({
            state:1,
            data:newIssueReason,
            message:'created'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


exports.getIssueReasons = async (req, res, next) => {

   

    try {
        
        const resons = await IssueRwasons.find({});

        res.status(201).json({
            state:1,
            data:resons,
            message:'created'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};