const express      = require('express');
const {body}       = require('express-validator');

const shopController = require('../../controllers/admin/shop');
const isAuth         = require('../../meddlewere/admin/isAuth');


const router  = express.Router();


router.get('/products/:catigoryId',isAuth,shopController.getProducts);                            
router.put('/product',[
    body('nameEn')
    .not().isEmpty(),
    body('nameAr')
    .not().isEmpty(),
    body('productType')
    .not().isEmpty(),
    body('category')
    .not().isEmpty(),
],isAuth,shopController.putProduct);                     

module.exports = router;