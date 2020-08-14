const express      = require('express');
const {body}       = require('express-validator');

const shopController = require('../../controllers/seller/shop');

const isAuth         = require('../../meddlewere/seller/isAuth');


const router  = express.Router();

router.get('/home',isAuth,shopController.getHome);

router.get('/orders',isAuth,shopController.getOrders);

router.put('/offer',[
    body('orderId')
    .not().isEmpty(),
    body('price')
    .not().isEmpty()
    .isNumeric(),
    body('banana_delivery')
    .not().isEmpty()
    .isBoolean(),

],isAuth,shopController.putOffer);



module.exports = router;