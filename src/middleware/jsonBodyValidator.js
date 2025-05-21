// This middleware that if the body sent by user is a valid and if not return with currosponding response.

function jsonBodyValidator(err,req,res,next){

    // @ts-ignore
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: "Invalid JSON" });
    }
    next();

}

module.exports = jsonBodyValidator