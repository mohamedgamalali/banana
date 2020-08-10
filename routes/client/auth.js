const express      = require('express');
const {body}       = require('express-validator');

const authController = require('../../controllers/client/auth');


const router  = express.Router();
router.put('/signup',[
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
    body('name').not().isEmpty().trim(),
    body('mobile')
    .not().isEmpty()
    .trim().isMobilePhone()
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