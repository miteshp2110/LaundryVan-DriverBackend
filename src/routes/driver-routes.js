const express = require("express");
const router = express.Router();
const { sendDriverOtp, verifyDriverOtp } = require("../controller/driver/auth");
const {
  getAssignedOrders,
  updateOrderStatus,
  getVanDetails,
  updatePaymentStatus,
  addOrderItems,
} = require("../controller/driver/orders");
const driverAuthMiddleware = require("../middleware/driver-auth");

// Public routes
router.post("/auth/send-otp", sendDriverOtp);
router.post("/auth/verify-otp", verifyDriverOtp);

// Protected routes
router.get("/orders", driverAuthMiddleware, getAssignedOrders);
router.post("/orders/status", driverAuthMiddleware, updateOrderStatus);
router.get("/van-details", driverAuthMiddleware, getVanDetails);
router.post("/orders/payment", driverAuthMiddleware, updatePaymentStatus);
router.post("/orders/add-items", driverAuthMiddleware, addOrderItems);

module.exports = router;
