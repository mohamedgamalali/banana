
const Delivery = require('../../models/delivery');

exports.getHome = async (req, res, next) => {

    const page = req.query.page || 0;
    const productPerPage = 10;


    try{


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}