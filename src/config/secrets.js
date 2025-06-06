const dotenv = require("dotenv")
dotenv.config()

module.exports = {
    PORT : process.env.PORT,
    MYSQL_HOST : process.env.MYSQL_HOST,
    MYSQL_PORT : process.env.MYSQL_PORT,
    MYSQL_USER : process.env.MYSQL_USER,
    MYSQL_PASSWORD : process.env.MYSQL_PASSWORD,
    MYSQL_LIMIT : process.env.MYSQL_LIMIT,
    MYSQL_DATABASE : process.env.MYSQL_DATABASE,
    JWT_SECRET : process.env.JWT_SECRET,
    BCRYPT_SALT : process.env.BCRYPT_SALT,
    TWILIO_ACCOUNT_SID : process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN : process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER : process.env.TWILIO_PHONE_NUMBER,
}