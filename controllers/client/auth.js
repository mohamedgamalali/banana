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
            error.state = 5;
            throw error;
        }

        const checkClient = await Client.findOne({ mobile: mobile });

        if (checkClient) {
            const error = new Error(`This user is already registered`);
            error.statusCode = 409;
            error.state = 6;
            throw error;
        }
        const hashedPass = await bycript.hash(password, 12);
        const newClient = new Client({
            name: name,
            mobile: mobile,
            password: hashedPass,
            fevProducts:[],
            updated:Date.now()
        });

        const client = await newClient.initFev();

        const token = jwt.sign(
            {
                mobile: client.mobile,
                userId: client._id.toString(),
                updated:client.updated.toString()
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
            error.state = 7;
            throw error;
        }
        const isEqual = await bycript.compare(password, client.password);
        if (!isEqual) {
            const error = new Error('wrong password');
            error.statusCode = 401;
            error.state = 8;
            throw error;
        }
        if (client.blocked == true) {
            const error = new Error('client have been blocked');
            error.statusCode = 403;
            error.state = 4;
            throw error;
        }

        const token = jwt.sign(
            {
                mobile: client.mobile,
                userId: client._id.toString(),
                updated:client.updated.toString()
            },
            process.env.JWT_PRIVATE_KEY_CLIENT
        );

        res.status(200).json({
            state: 1,
            message:"logedin",
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