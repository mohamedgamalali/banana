const Seller = require('../../models/seller');


exports.getHome = async (req, res, next) => {
    
    try {
        const seller = await Seller.findById(req.userId).select('category');

        res.status(200).json({
            state:1,
            data:seller.category,
            message:'seller categories'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}