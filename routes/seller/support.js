const express      = require('express');
const {body}       = require('express-validator');

const supportController = require('../../controllers/seller/support');

const isAuth         = require('../../meddlewere/seller/isAuth');


const router  = express.Router();

//issues
router.get('/issues',isAuth,supportController.getIssues);

router.get('/issue/single/:id',isAuth,supportController.getSingleIssue);

router.post('/issue/accept',[
    body('issueId')
    .not().isEmpty()
],isAuth,supportController.postIssueAccept);

module.exports = router;