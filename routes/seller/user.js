const express      = require('express');
const {body}       = require('express-validator');

const userController = require('../../controllers/seller/user');

const isAuth         = require('../../meddlewere/seller/isAuth');


const router  = express.Router();

router.get('/myOrders',isAuth,userController.getMyOrders);

router.get('/single/order/details/:offer',isAuth,userController.getSingleOrderDetails);

router.get('/myOffers',isAuth,userController.getMyOffers);


module.exports = router;