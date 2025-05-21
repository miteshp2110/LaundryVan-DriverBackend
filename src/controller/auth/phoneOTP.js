const { pool } = require("../../config/db")
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = require("../../config/secrets")
const getOtp = require("../../utils/otpManager")
const twilio = require("twilio")(TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN)

const sendOtpForMobile = async(req,res)=>{
    try{

        const {phone=null,countryCode=null} = req.body || {}
        if(!phone || !countryCode){
            return res.status(400).json({error:"Invalid Body"})
        }

        //TODO: Check into Db for existing
        const [isExisting] = await pool.query("Select count(id) as cnt from otp where phone = ?",[phone])
        if(isExisting[0].cnt > 0){
            return res.status(409).json({error:"OTP already sent"})
        }
        // const [existingPhone] = await pool.query("Select count(id) from users where phone = ?",[phone])
        // if(existingPhone[0]['count(id)'] > 0){}      
        const newOTP = getOtp()
        const conn = await pool.getConnection()
        try{
            conn.beginTransaction()
            await conn.query("Insert into otp (phone,otp) values (?,?)",[phone,newOTP])
        
            await twilio.messages
            .create({
                body: `Your OTP is ${newOTP} valid for 5 mins`,
                from: TWILIO_PHONE_NUMBER,
                to: `+${countryCode}${phone}`
            })
            await conn.commit()
            return res.status(200).json({message:`Sent OTP on ${phone} valid for 5 mins`})
        
        }
        catch(e){
            conn.rollback()
            console.error(e)
            return res.status(500).json({error:"Internal Server Error"})
        }
        finally{
            conn.release()
        }

        

    }
    catch(e){
        console.error(e)
        return res.status(500).json({error:"Internal Server Error"})
    }
}

const validateOtp = async(req,res)=>{
    try{
        const {phone=null,otp=null} = req.body || {}
        if(!phone || !otp){
            return res.status(400).json({error:"Invalid Body"})
        }
        // TODO: check in db if otp exists
        const [isExisting] = await pool.query("Select otp from otp where phone = ?",[phone])
        if(isExisting.length === 0){
            return res.status(401).json({error:"OTP not sent"})
        }
        else if (isExisting[0].otp === otp){
            return res.status(200).json({message:"success"})
            
        }
        else{
            return res.status(401).json({error:"Wrong OTP"})
        }
    }
    catch(e){
        console.error(e)
        return res.status(500).json({error:"Internal Server Error"})
    }
}


module.exports = {sendOtpForMobile,validateOtp}