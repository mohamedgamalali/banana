const bycript = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const Seller = require('../../models/seller');

exports.postSignup = async (req, res, next) => {
    const errors = validationResult(req);
    const name = req.body.name;
    const password = req.body.password;
    const mobile = req.body.mobile;
    const category = req.body.category;

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }
        if( category!='F-V'&& category!='B'&& category!='F-M'&& category!='F' ){
            const error = new Error(`validation faild for category not allowed value`);
            error.statusCode = 422;
            error.state = 5;
            throw error;
        }

        const checkSeller = await Seller.findOne({ mobile: mobile });

        if (checkSeller) {
            const error = new Error(`This user is already registered`);
            error.statusCode = 409;
            error.state = 6;
            throw error;
        }
        //to be contenue
        const hashedPass = await bycript.hash(password, 12);
        const newClient = new Seller({
            name: name,
            mobile: mobile,
            password: hashedPass,
            fevProducts:[],
        });

        const client = await newClient.initFev();

        const token = jwt.sign(
            {
                mobile: client.mobile,
                userId: client._id.toString()
            },
            process.env.JWT_PRIVATE_KEY_CLIENT
        );

        res.status(201).json({ 
            state: 1, 
            message: 'client created and logedIn', 
            data:{
                token: token,
                clientName: client.name,
                clientMobile: client.mobile,
                clientId: client._id
            }
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}
