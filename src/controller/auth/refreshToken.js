const { verifyRefreshToken, getJwtToken } = require("../../utils/jwtManager")


const revalidateUser = (req,res)=>{
    try{
        const {authorization} = req.headers
        if(!authorization){
            return res.status(400).json({error:"Token Required"})
        }  
        const token = authorization.split(' ')[1]
        let verification = verifyRefreshToken(token)
        if(verification === 'expired'){
            return res.status(401).json({error:"Expired"})
        }
        else{
            if(verification === 'invalid'){
                return res.status(401).json({error:"Invalid Token"})
            }
            else{
                return res.status(200).json({jwt:getJwtToken({email:verification,role:'user'})})
            }
        }
    }
    catch(e){
        return res.status(500).json({error:"Internal Server Error"})
    }
}

module.exports = revalidateUser