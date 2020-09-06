const express      = require('express');
const {body}       = require('express-validator');

const userController = require('../../controllers/seller/user');

const isAuth         = require('../../meddlewere/seller/isAuth');


const router  = express.Router();

router.get('/myOrders',isAuth,userController.getMyOrders);

router.get('/single/order/details/:offer',isAuth,userController.getSingleOrderDetails);


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

 //mobile
router.post('/profile/edit/mobile',[
    body('mobile')
    .not().isEmpty()
    .trim().isMobilePhone(),
    body('code')
    .not().isEmpty()
    .trim()
],isAuth,userController.postEditMobile);

router.post('/profile/edit/mobile/sendSMS',isAuth,userController.postSendSMS);

router.post('/profile/edit/mobile/checkCode',[
    body('code')
    .not().isEmpty()
],isAuth,userController.postCheckCode);

//certificate     // banana
router.post('/profile/certificate',[
    body('StringAdress')
    .not().isEmpty(),
    body('expiresAt')
    .not().isEmpty(),
    body('long1')
    .not().isEmpty(),
    body('lat1')
    .not().isEmpty(),
    body('openFrom')
    .not().isEmpty(),
    body('openTo')
    .not().isEmpty(),
],isAuth,userController.postAddCertificate)

router.post('/profile/category/add',[
    body('name')
    .not().isEmpty(),
],isAuth,userController.postAddCCategory)

router.post('/profile/category/delete',[
    body('name')
    .not().isEmpty(),
],isAuth,userController.postDeleteCategory)


//notfication
router.post('/notfication/send',[
    body('action')
    .not().isEmpty()
    .isBoolean()
],isAuth,userController.postManageSendNotfication);

//wallet
router.get('/wallet',isAuth,userController.getWallet);

//notfications
router.get('/notfication',isAuth,userController.getNotfications);




module.exports = router;