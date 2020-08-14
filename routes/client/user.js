const express      = require('express');
const {body}       = require('express-validator');

const isAuth         = require('../../meddlewere/client/isAuth');
const userController = require('../../controllers/client/user');


const router  = express.Router();

//orders
router.get('/myOrders',isAuth,userController.getOrders);

router.post('/order/cancel',[
    body('orderId')
    .not().isEmpty(),
],isAuth,userController.postCancelOrder);

//fev
router.get('/myFev/lists',isAuth,userController.getMyFevList);

router.get('/myFev/products/:id',isAuth,userController.getMyfevProducts);

//profile
router.post('/profile/edit/name',[
    body('name')
    .not().isEmpty()
    .trim(),
],isAuth,userController.postEditName);

router.post('/profile/edit/password',[
    body('oldPassword','enter a password with only number and text and at least 5 characters.')
    .not().isEmpty()
    .trim(),
    body('password','enter a password with only number and text and at least 5 characters.')
    .isLength({min:5})
    .trim()
    ,
    body('comfirmPassword')
    .trim()
    .custom((value,{req})=>{
        if(value!=req.body.password){
            return Promise.reject('password has to match');
        }
        return true ;
    })
],isAuth,userController.postEditPassword);

router.post('/profile/edit/mobile',[
    body('mobile')
    .not().isEmpty()
    .trim().isMobilePhone(),
],isAuth,userController.postEditMobile);

//my locations
router.get('/profile/location',isAuth,userController.getLocations);


module.exports = router;