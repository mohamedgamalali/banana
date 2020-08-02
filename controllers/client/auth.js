const bycript = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const Client = require('../../models/client');

exports.postSignup = async (req, res, next) => {
    const errors = validationResult(req);
    const name = req.body.name;
    const password = req.body.password;
    const mobile = req.body.mobile;

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            throw error;
        }

        const checkClient = await Client.findOne({ mobile: mobile });

        if (checkClient) {
            const error = new Error(`This user is already registered`);
            error.statusCode = 409;
            throw error;
        }
        const hashedPass = await bycript.hash(password, 12);
        const newClient = new Client({
            name: name,
            mobile: mobile,
            password: hashedPass,
            fevProducts:[],
        });
        //await newClient.initFev();
        const client = await newClient.save();
        res.status(201).json({ state: 1, message: 'client created', data: { clientId: client } });

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
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            throw error;
        }

        const client = await Client.findOne({ mobile: mobile })
        if (!client) {
            const error = new Error(`Client not found`);
            error.statusCode = 404;
            throw error;
        }
        const isEqual = await bycript.compare(password, client.password);
        if (!isEqual) {
            const error = new Error('wrong password');
            error.statusCode = 401;
            throw error;
        }
        if (client.blocked == true) {
            const error = new Error('client have been blocked');
            error.statusCode = 403;
            throw error;
        }

        const token = jwt.sign(
            {
                mobile: client.mobile,
                userId: client._id.toString()
            },
            process.env.JWT_PRIVATE_KEY_CLIENT
        );

        res.status(200).json({
            state: 1,
            message:"logedin",
            data:{
                token: token,
                userName: client.name,
                userMobile: client.mobile,
                userId: client._id
            }
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}