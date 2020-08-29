const { validationResult } = require("express-validator");
const Policy               = require('../../models/policy');

//policy
exports.getPolicy = async (req, res, next) => {
    
    
    try {
        
        const policy = await Policy.findOne({});
        
        res.status(200).json({
            state:1,
            policy:policy
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
    const EN     = req.body.EN;
    const AR     = req.body.AR;

    try {
        if (!errors.isEmpty()) {
          const error = new Error(`validation faild..${errors.array()[0].param} : ${errors.array()[0].msg}`);
          error.statusCode = 422;
          error.data = errors.array();
          throw error;
        }
        
        const policy = await Policy.findOne({});
        if(!policy){
            const newPolicy = new Policy({
                EN:EN,
                AR:AR
            });
            await newPolicy.save()
        }else{
            policy.EN = EN ;
            policy.AR = AR ;
            await policy.save()
        }
        
        res.status(200).json({
            state:1,
            message:'added'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};