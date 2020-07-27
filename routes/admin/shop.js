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

router.post('/product/edit',[
    body('productId')
    .not().isEmpty(),
    body('nameEn')
    .not().isEmpty(),
    body('nameAr')
    .not().isEmpty(),
    body('productType')
    .not().isEmpty(),
    body('category')
    .not().isEmpty(),
],isAuth,shopController.postEditProduct);

router.delete('/product/delete',[
    body('productId')
    .not().isEmpty(),
],isAuth,shopController.deleteProduct);

module.exports = router;