const express = require('express')
const { checkServiceArea } = require('../controller/address/serviceArea')
const { addAddress, getAllAddresses, getAddressDetail, deleteAddress, updateAddress } = require('../controller/address/address')
const checkUser = require('../middleware/checkUser')
const router = express.Router()


router.post("/checkService",checkServiceArea)

router.post("/add",checkUser,addAddress)
router.get("/all",checkUser,getAllAddresses)
router.get("/detail/:id",checkUser,getAddressDetail)
router.delete("/delete/:id",checkUser,deleteAddress)
router.put("/update/:id",checkUser,updateAddress)

module.exports = router