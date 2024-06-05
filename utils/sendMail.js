const nodeMailer=require('nodemailer');
const sendEmail=async(options)=>{
    const transpoter=nodeMailer.createTransport({
        service:"gmail",
        host:"smtp.gmail.com",
        port:465,
        secure:false,
        auth:{
            user:"deepak2198.be21@chitkara.edu.in",
            pass:"lbhl wnoz zjoa jpam"
        }

    });
    const mailoptions={
        from:"deepak2198.be21@chitkara.edu.in",
        to:options.email,
        subject:options.subject,
        text:options.message
    };
    await transpoter.sendMail(mailoptions);
}
module.exports=sendEmail;
