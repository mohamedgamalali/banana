const { validationResult } = require('express-validator');

const Issue = require('../../models/issues');
const SupportMessage = require('../../models/supportMessages');
const Policy               = require('../../models/policy');
const Conditions               = require('../../models/conditions');


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
            user_type:'seller'
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

exports.getIssues = async(req,res,next)=>{
    const page   = req.query.page   || 1 ;
    const filter = req.query.filter || 'binding' ;
    const issuePerPage = 10 ;
    try {
        
        const total  = await Issue.find({seller:req.userId,state:filter}).countDocuments()
        const issues = await Issue.find({seller:req.userId,state:filter})
        .sort({ createdAt: -1 })
        .skip((page - 1) * issuePerPage)
        .limit(issuePerPage)
        .select('order offer')
        .populate({
            path:'order',
            select:'products',
            populate:{
                path:'products.product',
                select:'name_ar name_en name'
            }
        })
        .populate({
            path:'offer',
            select:'banana_delivery price selected'
        });

        res.status(200).json({
            state:1,
            data:issues,
            total:total,
            message:`issues in page ${page} and filter ${filter}`
        })
        

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        console.log(err);
        next(err);
    }
}

exports.getSingleIssue = async(req,res,next)=>{
    const issueId   = req.params.id ;

    try {
        
        const issues = await Issue.findById(issueId)
        .select('imageUrl state order reason demands offer')
        .populate({path:'offer',select:'price'});
        if (!issues) {
            const error = new Error(`issues not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }

        res.status(200).json({
            state:1,
            data:issues,
            message:`issues with id ${issueId}`
        });
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        console.log(err);
        next(err);
    }
}

exports.postIssueAccept = async(req,res,next)=>{
    const issueId   = req.body.issueId ;

    const errors = validationResult(req);

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        
        const issues = await Issue.findById(issueId).select('imageUrl state order reason demands');
        if (!issues) {
            const error = new Error(`issues not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        }

        //manage with wallet
        //to be contenue

        
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        console.log(err);
        next(err);
    }
}

exports.postIssueRefuse = async(req,res,next)=>{
    const issueId   = req.body.issueId ;

    const errors = validationResult(req);

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        
        const issues = await Issue.findById(issueId).select('imageUrl state order reason demands');
        if (!issues) {
            const error = new Error(`issues not found`);
            error.statusCode = 404;
            error.state = 9;
            throw error;
        } 
        
        issues.state = 'cancel' ;
        
        await issues.save();

        res.status(200).json({
            state:1,
            message:'issue canceld'
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
            data:conditions,
            message:'conditiond'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};