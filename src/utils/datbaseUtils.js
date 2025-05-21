const { pool } = require("../config/db")

const QUERY_EXISTING_USER_DEFAULT = "SELECT authType,password FROM users WHERE email = ?"
const QUERY_EXISTING_USER_GOOGLE = "SELECT * FROM users WHERE email = ? AND authType = 'google'"



async function checkExistingUserDefault(email){

    try{
        const [result] = await pool.query(QUERY_EXISTING_USER_DEFAULT,[email])
        // @ts-ignore
        if(result.length === 0){
            return false
        }
        else{
            if(result[0].authType === 'password'){
                return result[0].password
            }
            else{
                return 'google'
            }
        }
        
    }
    catch(err){
        console.error(err)
        return false
    }
} 

module.exports = {checkExistingUserDefault}