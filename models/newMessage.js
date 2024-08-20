const mongoose=require('mongoose');
const messageSchema=mongoose.Schema({
    sender:{
        type:String,
        required:true
    },
    content:{
        type:String,
        trim:true
    },
    chat:{
        type:mongoose.Schema.Types.ObjectId, 
        ref:"newChat"
    }
},
    {
        timestamps:true
    }
);
const newMessage=mongoose.model("newMessage",messageSchema);
module.exports=newMessage;