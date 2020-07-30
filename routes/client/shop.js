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

router.delete('/cart/delete',[
    body('cartItemId')
    .not().isEmpty(),
],isAuth,shopController.deleteCart);

module.exports = router;