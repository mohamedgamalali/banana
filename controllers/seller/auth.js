const bycript = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const Seller = require('../../models/seller');

exports.postSignup = async (req, res, next) => {
    const errors = validationResult(req);
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const mobile = req.body.mobile;
    const category = req.body.category;

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} '${errors.array()[0].msg}'`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
    
        category.forEach(e => {
            if( e!='F-V'&& e!='B'&& e!='F-M'&& e!='F' ){
                const error = new Error(`validation faild for category in body.. not allowed value`);
                error.statusCode = 422;
                error.state = 5;
                throw error;
            }
        });

        const checkSeller = await Seller.findOne({ mobile: mobile });

        if (checkSeller) {
            const error = new Error(`This user is already registered with mobile`);
            error.statusCode = 409;
            error.state = 6;
            throw error;
        }
        const checkSellerEmail = await Seller.findOne({ email: email });

        if (checkSellerEmail) {
            const error = new Error(`This user is already registered with email`);
            error.statusCode = 409;
            error.state = 26;
            throw error;
        }
        const hashedPass = await bycript.hash(password, 12);
        const cat = [];
        category.forEach(i=>{
            cat.push({
                name:i
            })
        })
        const newSeller = new Seller({
            name: name,
            mobile: mobile,
            email:email,
            password: hashedPass,
            category:cat,
            updated:Date.now().toString()
        });

        const seller = await newSeller.save();

        const token = jwt.sign(
            {
                mobile: seller.mobile,
                userId: seller._id.toString(),
                updated:seller.updated.toString()
            },
            process.env.JWT_PRIVATE_KEY_SELLER
        );

        res.status(201).json({ 
            state: 1, 
            message: 'seller created and logedIn', 
            data:{
                token: token,
                sellerName: seller.name,
                sellerMobile: seller.mobile,
                sellerId: seller._id
            }
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.postLogin = async (req, res, next) => {
    const errors = validationResult(req);
    const mobile = req.body.mobile;
    const password = req.body.password;

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} '${errors.array()[0].msg}'`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
    
        const seller = await Seller.findOne({ mobile: mobile })
        if (!seller) {
            const error = new Error(`seller not found`);
            error.statusCode = 404;
            error.state = 7;
            throw error;
        }
        const isEqual = await bycript.compare(password, seller.password);
        if (!isEqual) {
            const error = new Error('wrong password');
            error.statusCode = 401;
            error.state = 8;
            throw error;
        }
        if (seller.blocked == true) {
            const error = new Error('seller have been blocked');
            error.statusCode = 403;
            error.state = 4;
            throw error;
        }

        const token = jwt.sign(
            {
                mobile: seller.mobile,
                userId: seller._id.toString(),
                updated:seller.updated.toString()
            },
            process.env.JWT_PRIVATE_KEY_SELLER
        );

        res.status(200).json({
            state: 1,
            message:"logedin",
            data:{
                token: token,
                sellerName: seller.name,
                sellerMobile: seller.mobile,
                sellerId: seller._id
            }
        });
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}