const { verifyJwtToken } = require("../utils/jwtManager");

const checkUser = (async(req,res,next)=>{
    try{
        const {authorization} = req.headers
        if(!authorization){
            return res.status(400).json({error:"Token Required"})
        }  
        const token = authorization.split(' ')[1]
        let verification = verifyJwtToken(token)
        if(verification === 'invalid'){
            return res.status(401).json({error:"Unauthorized"})
        }
        else{
            if(verification === 'expired'){
                return res.status(401).json({error:"Expired"})
            }
        }
        req.user = verification
        next()

    }
    catch(err){
        console.error(err)
        return res.status(500).json({message:"Some Error Occured"})
    }
})

module.exports=checkUser