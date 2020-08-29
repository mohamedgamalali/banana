const express      = require('express');
const {body}       = require('express-validator');

const supportController = require('../../controllers/admin/support');


const router  = express.Router();

//policy
router.get('/support/policy',supportController.getPolicy);                              

router.post('/support/policy',[
    body('EN')
    .not().isEmpty(),
    body('AR')
    .not().isEmpty()
],supportController.postAddPolicy);                              

module.exports = router;