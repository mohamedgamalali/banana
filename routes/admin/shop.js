const express      = require('express');
const {body}       = require('express-validator');

const shopController = require('../../controllers/admin/shop');


const router  = express.Router();


router.get('/products/:catigoryId',shopController.getProducts);                                   

module.exports = router;