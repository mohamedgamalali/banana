const express      = require('express');
const {body}       = require('express-validator');

const shopController = require('../../controllers/client/shop');
const isAuth         = require('../../meddlewere/client/isAuth');

const router  = express.Router();

router.get('/products/:catigoryId',isAuth,shopController.getProducts);

module.exports = router;