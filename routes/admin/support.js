const express      = require('express');
const {body}       = require('express-validator');

const supportController = require('../../controllers/admin/support');
const isAuth         = require('../../meddlewere/admin/isAuth');


const router  = express.Router();

//policy
router.get('/support/policy',isAuth,supportController.getPolicy);                              

router.post('/support/policy',[
    body('EN')
    .not().isEmpty(),
    body('AR')
    .not().isEmpty()
], isAuth,supportController.postAddPolicy);

//conditions
router.get('/support/conditions', isAuth,supportController.getConditions);                              

router.post('/support/conditions',[
    body('EN')
    .not().isEmpty(),
    body('AR')
    .not().isEmpty()
], isAuth,supportController.postConditions);

module.exports = router;