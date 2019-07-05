const express = require('express');
const router = express.Router();

const WechatController = require('../controllers/wechat');


router.get('/', WechatController.init);
router.post('/', WechatController.message);
// router.get('/getAccessToken', WechatController.getAccessToken);
router.get('/createWxMenu', WechatController.createWxMenu);
router.get('/js_sign_info', WechatController.wxJsAuth);

module.exports = router;
