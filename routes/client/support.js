const express      = require('express');
const {body}       = require('express-validator');

const supportController = require('../../controllers/client/support');
const isAuth         = require('../../meddlewere/client/isAuth');

const router  = express.Router();

//issues
router.post('/support/issue',[
    body('orderId')
    .not().isEmpty(),
    body('reason')
    .not().isEmpty(),
    body('demands')
    .not().isEmpty(),
],isAuth,supportController.postIssue);

module.exports = router;