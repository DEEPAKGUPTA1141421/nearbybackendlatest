const customError = require("../middleware/customError");
const Message = require("../models/message");
const Chat =require("../models/chat");
const User=require("../models/user");
const Shop=require("../models/shop");
module.exports.accesschat=async(req,res,next)=>{
    const userId=req.user._id;
    // const receiverId=req.params.shopId;
    console.log("query",req.params.receiverId);
    // console.log("shopId",req.params.receiverId);
    const shop=await Shop.findById(req.params.receiverId);
    console.log("shop",shop);
    receiverId=shop.user;
    console.log("userId",userId,receiverId);
    var  isChat=await Chat.find({
        $and:[
            {users:{$eq:receiverId}},
            {users:{$eq:userId}}
        ]
    });
    if(isChat.length>0){
        res.status(200).json({
            success:true,
            message:"Old Chats are There",
            chat:isChat[0]
        })
    }
    else{
        var chatData={
            chatName:"sender",
            users:[receiverId,userId]
        };
        try{
            const createChat=await Chat.create(chatData);
            const FullChat=await Chat.findOne({
                _id:createChat._id
            });
            res.status(200).json({
                success:true,
                message:"new chat Created",
                FullChat:FullChat
            }
            )
        }
        catch(err){
            next(new customError(err.message,404));
        }
    }
}
module.exports.fetchchat=async(req,res,next)=>{
    try {
        const userId=req.user._id;
        const chats = await Chat.find({ users: { $elemMatch: { $eq: userId } } }).populate('users')
        .populate("latestMessage")
        .sort({ updatedAt: -1 })
        .exec();
        
        console.log("all chats",chats);  
        if(!chats){
            next(new customError("no chat for this user",404));
        } 
        else{
            res.status(200).json({
                message:"all chats of a user",
                success:true,
                chats:chats
            }) 
        } 
      } catch (err){
        next(new customError(err.message,404));
      }
}
module.exports.sendmessage=async(req,res,next)=>{
    try{
        const userId=req.user._id;
        const chatId=req.params.chatId;
        // const userId=req.body.userId;
        // const chatId=req.body.chatId;
        const{content}=req.body;
        console.log("content",content,chatId);
        var newMessage={
            sender:userId,
            content:content,
            chat:chatId
        }
        const message=await Message.create(newMessage);
        const populatedMessage = await Message.findById(message._id).populate('chat').exec();
        await Chat.findByIdAndUpdate(chatId,{
            latestMessage:message._id
        });
        res.status(200).json({
            message:"message sent",
            success:true,
            currmessage: populatedMessage
        })
    }
    catch(err){
        next(new customError(err.message,404));
    }

}
module.exports.allmessage=async(req,res,next)=>{
    try{
        const chatId=req.params.chatId;
        const message=await Message.find({chat:chatId})
        .populate("sender","name pic email")
        .populate("chat")
        .sort({createdAt:1});
        res.status(200).json({
            message:"all message",
            success:true,
            message:message
        })
     }
     catch(err){
        next(new customError(err.message,404));
     }
}