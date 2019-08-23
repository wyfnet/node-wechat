const express = require('express');
const router = express.Router();

const SignController = require('../controllers/sign');


router.get('/', SignController.sign);

module.exports = router;