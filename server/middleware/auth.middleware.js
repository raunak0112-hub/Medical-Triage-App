const jwt=require('jsonwebtoken')

module.exports=function(req,res,next){
    //geting token from header
    const token=req.header('Authorization')
    if(!token){
        return res
        .status(401)   
        .json(
            {
                message: "No token, authorization denied"
            }
        )
    }

    try {
        //Verify token
        const decoded=jwt.verify(token.replace('Bearer ',''),process.env.JWT_SECRET)
        //Attach the user payload to req object
        req.user=decoded.user;
        next();
    }
    catch(err) {
        res
            .status(401)
            .json(
                {
                    message: 'Token is not valid'
                }
            )
    }
}