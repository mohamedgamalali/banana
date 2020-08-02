const express      = require('express');
const {body}       = require('express-validator');

const shopController = require('../../controllers/client/shop');
const isAuth         = require('../../meddlewere/client/isAuth');

const router  = express.Router();

router.get('/products/:catigoryId',isAuth,shopController.getProducts);

router.post('/cart/add',[
    body('productId')
    .not().isEmpty(),
    body('unit')
    .not().isEmpty(),
    body('amount')
    .not().isEmpty()
    .isNumeric(),
],isAuth,shopController.postAddToCart);

router.post('/cart/add/food',[
    body('name')
    .not().isEmpty(),
    body('unit')
    .not().isEmpty(),
    body('amount')
    .not().isEmpty()
    .isNumeric(),
],isAuth,shopController.postAddToCartFood);

router.delete('/cart/delete',[
    body('cartItemId')
    .not().isEmpty(),
],isAuth,shopController.deleteCart);

router.get('/cart',isAuth,shopController.getCart);

router.post('/fev',[
    body('productId')
    .not().isEmpty(),
],isAuth,shopController.postAddFev);
router.post('/fev/list',[
    body('ListName')
    .not().isEmpty(),
],isAuth,shopController.postAddFevList);

module.exports = router;