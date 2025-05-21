const express = require('express')
const {handleFileUpload} = require('../middleware/uploads')
const { signUpWithPassword, loginWithPassword } = require('../controller/auth/defaultController')
const revalidateUser = require('../controller/auth/refreshToken')
const {sendOtpForMobile, validateOtp} = require('../controller/auth/phoneOTP')
const router = express.Router()



router.post("/default/signup",handleFileUpload,signUpWithPassword)
router.get("/refresh",revalidateUser)
router.post("/default/login",loginWithPassword)
router.post("/sendOTP",sendOtpForMobile)
router.post("/validateOtp",validateOtp)


module.exports = router