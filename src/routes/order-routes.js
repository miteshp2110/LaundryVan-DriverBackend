const express = require('express');
const checkUser = require('../middleware/checkUser');
const { addOrder, getOrderDetail, getPreviousOrders } = require('../controller/orders/orders');
const router = express.Router();



router.post("/create",checkUser,addOrder)
router.get("/previousOrders",checkUser,getPreviousOrders)


module.exports = router