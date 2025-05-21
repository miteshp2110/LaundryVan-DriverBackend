const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/secrets')

const optionsForJwt = {
    algorithm:"HS256",
    expiresIn:"7d"
}

const optionsForRefreshToken = {
    algorithm:"HS256",
    expiresIn:"150d"
}

function getJwtToken (payload={}){
    try{
        const finalToken = jwt.sign(payload,JWT_SECRET,optionsForJwt)
        return finalToken
    }
    catch(err){
        console.log(err)
        return null
    }
}
function getRefreshToken (payload={}){
    try{
        const finalToken = jwt.sign(payload,JWT_SECRET,optionsForRefreshToken)
        return finalToken
    }
    catch(err){
        console.log(err)
        return null
    }
}



function verifyJwtToken(token){
    try{
        const isValid = jwt.verify(token,JWT_SECRET,{algorithms:"HS256"})
        if(isValid.role==='user'){
            return {email:isValid.email}
        }
        else{
            return 'invalid'
        }


    }
    
    catch(err){
        if(err.name==="TokenExpiredError"){
            return 'expired'
        }
        else if(err.name==="JsonWebTokenError"){
            return 'invalid'
        }
        else{
            return 'invalid'
        }
    }
}

function verifyRefreshToken(token){
    try{
        const isValid = jwt.verify(token,JWT_SECRET,{algorithms:"HS256"})

        if(isValid.type === 'refresh'){
            return isValid.email
        }
        else{
            return 'invalid'
        }

    }
    
    catch(err){
        if(err.name==="TokenExpiredError"){
            return 'expired'
        }
        else if(err.name==="JsonWebTokenError"){
            return 'invalid'
        }
        else{
            return 'invalid'
        }
    }
}


module.exports = {getJwtToken,verifyJwtToken,getRefreshToken,verifyRefreshToken}