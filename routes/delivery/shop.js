const express      = require('express');
const {body}       = require('express-validator');

const shopController = require('../../controllers/delivery/shop')  ;
const isAuth         = require('../../meddlewere/delivery/isAuth') ;

const router  = express.Router();

router.get('/home',isAuth,shopController.getHome) ;

module.exports = router;