const cloudinary = require("cloudinary").v2;


//local file upload ka handler
exports.localFileUpload = async(req,res)=>{
    try{

         //fetching file from request 
         const file = req.files.file;
         console.log("file agyi jee->"  ,file);
     
         //define server path to upload file
         let path = `__dirname + "/files/" + Date.now() + .${file.name.split('.')[1]}`;
         console.log("path" ,path);
     
         //move the file to defined path 
         file.mv(path , (err)=>{
             console.log(err);
         })

         res.status(200).json({
            success:true,
            message:"Local File Uploaded Successfully",
         })
    }catch(error){
        console.log(error);
    }

}
//checking filetype is supported or not
function isFileTypeSupported(fileType,supportedTypes){
    return supportedTypes.includes(fileType);
}

//funcion to upload data on cloudinary
async function uploadFileToCloudinary(file,folder,quality=80){
    const options = {folder};
    console.log("tempfile path",file.tempFilePath);
    if(quality){
        options.quality = quality;
    }
    options.resource_type= "auto";
    return await cloudinary.uploader.upload(file.tempFilePath,options);
}



//imageUpload ka handler
exports.imageFileUpload = async(req,res)=>{
    try{
        const file = req.files.imageFile;
        console.log("myfile",file);
    
        //validation of file
        const supportedTypes = ["jpeg" , "png" , "jpg"];
        const fileType = file.name.split('.')[1].toLowerCase();
    
        if(!isFileTypeSupported(fileType,supportedTypes)){
            return res.status(400).json({
                success:false,
                message:"file type not supported",
            })
        }
    
        //file format supported hai
        console.log("uploading on cloudinary to Multivendor named folder")
        const response = await  uploadFileToCloudinary(file,"Multivendor");
        console.log("response",response);
        res.json({
            success:true,
            imageUrl:response.secure_url,
            message:"Image uploaded successfully",
        })

    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:"something went wrong while uploading image",
        })
    }
}

exports.videoFileUpload = async(req,res)=>{
    try{
        const {name ,tags, email} = req.body;
        console.log(name , email, tags);
    
        const videoFile = req.files.videoFile;
        
        const fileType = videoFile.name.split('.')[1];
        console.log(fileType);
        const supportedType = ["mp4" , "mov"];
    
        if(!isFileTypeSupported(fileType,supportedType)){
            return res.json({
                success:false,
                message:"file type is not supported",
            })
        }
        console.log("uploading video");
        const response =  await  uploadFileToCloudinary(videoFile,"Multivendor");
        console.log(response);
    
        const fileData = await File.create({
            name,
            tags,
            email,
            videoUrl:response.secure_url,
        })
    
        res.json({
            success:true,
            videoUrl:response.secure_url,
            message:"Image uploaded successfully",
        })
    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:"something went wrong while uploading vedeo",
            detail:error,
        })
    }

}

exports.imageSizeReducer = async(req,res)=>{
    try{

        //fetching the detail
        const {name , tags, email} = req.body;
        console.log(name , email , tags);
    
        //fetching the image file
        const file = req.files.imageFile;
        console.log(file);
    
        //validation of file
        const supportedTypes = ["jpeg" , "png" , "jpg"];
        const fileType = file.name.split('.')[1].toLowerCase();
    
        if(!isFileTypeSupported(fileType,supportedTypes)){
            return res.status(400).json({
                success:false,
                message:"file type not supported",
            })
        }
    
        //file format supported hai
        console.log("uploading on cloudinary to Multivendor named folder")
        const response = await  uploadFileToCloudinary(file,"Multivendor",80);
        console.log(response);
    
        //db me entry save krni hai
        const fileData = await File.create({
            name,
            tags,
            email,
            imageUrl:response.secure_url,
        })
    
        res.json({
            success:true,
            imageUrl:response.secure_url,
            message:"Reduced Image uploaded successfully",
        })

    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:"something went wrong while uploading reduced image",
        })
    }
}