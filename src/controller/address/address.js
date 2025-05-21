const { pool } = require("../../config/db")

const addAddress = async(req,res)=>{
    try{
        const {email} = req.user
        const {addressType=null,region_id=null,addressName=null,area=null,buildingNumber=null,landmark=null,latitude=null,longitude=null} = req.body || {}

        if(!addressType || !region_id || !addressName || !area || !buildingNumber || !landmark || !latitude || !longitude){
            return res.status(400).json({error:"Invalid Body"})
        }

        var addr = addressType.toLowerCase()

        addr = addr.charAt(0).toUpperCase() + addr.slice(1)
        await pool.query("Insert into addresses(addressType,user_id,region_id,addressName,area,buildingNumber,landmark,latitude,longitude) values (?,(select id from users where email = ?),?,?,?,?,?,?,?)",[addr,email,region_id,addressName,area,buildingNumber,landmark,latitude,longitude])

        return res.status(201).json({message:"Address Added"})

    }
    catch(e){
        console.error(e)
        return res.status(500).json({error:"Internal Server Error"})
    }
}


const getAllAddresses = async(req,res)=>{
    try{
        const {email} = req.user
        const [result] = await pool.query("select id ,addressType , region_id , addressName  , area, buildingNumber , landmark , latitude , longitude from addresses where user_id = (select id from users where email = ?)",[email])
        return res.status(200).json(result)

    }
    catch(e){
        console.error(e)
        return res.status(500).json({error:"Internal Server Error"})
    }
}


const getAddressDetail = async(req,res)=>{
    try{

        const id = req.params.id
        const [result] = await pool.query("select * from addresses where id = ?",[id])
        return res.status(200).json(result[0])

    }
    catch(e){
        console.error(e)
        return res.status(500).json({error:"Internal Server Error"})
    }
}

const deleteAddress = async(req,res)=>{
    try{

        const id = req.params.id
        await pool.query("delete from addresses where id = ?",[id])
        return res.status(200).json({message:"Address Deleted"})

    }
    catch(e){
        console.error(e)
        return res.status(500).json({error:"Internal Server Error"})
    }
}

const updateAddress = async(req,res)=>{
    try{
        const id = parseInt(req.params.id)
        const {addressType=null,region_id=null,addressName=null,area=null,buildingNumber=null,landmark=null,latitude=null,longitude=null} = req.body || {}

        if(!addressType || !region_id || !addressName || !area || !buildingNumber || !landmark || !latitude || !longitude){
            return res.status(400).json({error:"Invalid Body"})
        }

        await pool.query("update addresses set addressType = ? ,region_id =? ,addressName=?,area=?,buildingNumber=?,landmark=?,latitude=?,longitude=? where id = ?",[addressType,region_id,addressName,area,buildingNumber,landmark,latitude,longitude,id])

        return res.status(201).json({message:"Address Updated"})

    }
    catch(e){
        console.error(e)
        return res.status(500).json({error:"Internal Server Error"})
    }
}



module.exports = {addAddress,getAllAddresses,getAddressDetail,deleteAddress,updateAddress}