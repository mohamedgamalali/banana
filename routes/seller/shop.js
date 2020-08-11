const express      = require('express');
const {body}       = require('express-validator');

const shopController = require('../../controllers/seller/shop');

const isAuth         = require('../../meddlewere/seller/isAuth');


const router  = express.Router();

router.get('/home',isAuth,shopController.getHome);

router.get('/orders',isAuth,shopController.getOrders);



module.exports = router;