const express      = require('express');
const {body}       = require('express-validator');

const userController = require('../../controllers/seller/user');

const isAuth         = require('../../meddlewere/seller/isAuth');


const router  = express.Router();

router.get('/myOrders',isAuth,userController.getMyOrders);

router.get('/single/order/details/:offer',isAuth,userController.getSingleOrderDetails);

router.get('/myOffers',isAuth,userController.getMyOffers);

router.post('/profile/edit/name',
    body('name')
    .not().isEmpty()
,isAuth,userController.postEditName);

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

router.post('/sms',userController.postSMS)

module.exports = router;