const Issue = require('../../models/issues');
const Offer = require('../../models/offer');


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
        
        const issues = await Issue.findById(issueId).select('imageUrl state order reason demands');
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

        const offer = await Offer.findOne({})

        
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        console.log(err);
        next(err);
    }
}