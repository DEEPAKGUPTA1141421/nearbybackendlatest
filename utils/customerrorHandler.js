module.exports=(err,req,res,next)=>{
    err.message=err.message||"Internal Srerver Error";
    err.statuscode=err.statuscode||500;
    if(err.name==="castError"){
        const message=`resource not found with this Id.. Inavlid ${err.path}`;
        //err=new ErrorHandler(message,400);
    }
    //duplicate key error
    if(err.code===11000){
        const message=`Duplicate key ${Object.keys(err.keyValue)} Entered`;
        //err=new ErrorHandler(message,400);
    }
    if(err.name==="jsonWebTokenError"){
        const message=`Your Url is Inavlid Please try again later`;
        //err=new ErrorHandler(message,400);
    }
    if(err.name==="TokenExpiredError"){
        const message=`Your Url is Expired Plaese try agisn later`;
        //err=new ErrorHandler(message);
    }
    res.status(200).json({
        success:false,
        message:err.message,
        statuscode:err.statuscode
    })
};