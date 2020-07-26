const express      = require('express');
const {body}       = require('express-validator');

const shopController = require('../../controllers/admin/shop');
const isAuth         = require('../../meddlewere/admin/isAuth');


const router  = express.Router();


router.get('/products/:catigoryId',isAuth,shopController.getProducts);                                   

module.exports = router;