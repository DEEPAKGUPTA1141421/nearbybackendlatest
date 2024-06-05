module.exports.sendToken=async(user,statusCode,message,res)=>{
    const token=user.getJwtToken();
    // options for cookies
    //const COOKIES_EXPIRES=Number
    console.log("token",token);
    res.cookie('token', token, {
        expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days in milliseconds
        httpOnly: true,
    });
    return res.status(statusCode).json({
        user:user,
        message:message,
        success:true
    })
};
