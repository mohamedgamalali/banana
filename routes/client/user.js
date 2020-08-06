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


module.exports = router;