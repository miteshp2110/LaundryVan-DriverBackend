const express = require('express');
const router = express.Router();
const checkUser = require('../middleware/checkUser');

const { getPromotions,isPromotionApplicable} = require('../controller/promotions/promotions');


router.get('/list', checkUser, getPromotions);
router.post('/isApplicable', checkUser, isPromotionApplicable);

module.exports = router;