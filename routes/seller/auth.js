const express      = require('express');
const {body}       = require('express-validator');

const authController = require('../../controllers/seller/auth');


const router  = express.Router();

router.put('/signup',[
    body('email')
    .isEmail()
    .withMessage('please enter a valid email.')
    .normalizeEmail(),
    body('name')
    .not().isEmpty()
    .trim(),
    body('mobile')
    .not().isEmpty()
    .isMobilePhone().trim(),
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
    }),
    body('category')
    .not().isEmpty()
    .isArray({min:1,max:4}),
],authController.postSignup);

router.post('/login',[
    body('mobile')
    .not().isEmpty()
    .trim(),
    body('password')
    .not().isEmpty()
    .trim(),
],authController.postLogin);

module.exports = router;