const mongoose=require('mongoose');
const chatSchema=mongoose.Schema(
    {
        chatName:{
            type:String,
            trim:true
        },
        users:[
            {
               type:String,
               required:true
            }
        ],
        latestMessage:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Message"
        },
    },
    {
        timestamps:true
    }
)
const newChat=mongoose.model("newChat",chatSchema);
module.exports=newChat;