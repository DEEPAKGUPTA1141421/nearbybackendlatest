const mongoose=require('mongoose');
const riderSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    phoneNumber:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    adhaharNumber:{
        type:String,
        required:true
    },
    panNumber:{
        type:String,
        required:true
    },
    age:{
        type:String,
        required:true,
        min:[18,"min age is 18"]
    },
    gender:{
        type:String,
        required:true
    },
    policeCase:{
        type:String,
        required:[true,"please enter that have you ever been in police case or not"]
    },
    password:{
        type:String,
        required:[true,"enter the password"],
        minLength:[8,"password must have atleast 8 letters"],
        select:false
    },
    imageofrider:{
        type:String
    },
    role:{
        type:String,
        default:"Rider"
    },
    jointAt:{
        type:Date,
        default:Date.now
    },
    typeOfVan:{
        type:String,
        required:[true,"please select you have 2 wheller or 3 wheller or 4 wheller van"],
    },
    nameOfVan:{
        type:String,
        required:[true,"enter the name of van"]
    },
    allocatedOrder:[
        {
            TrackId:{
                type:mongoose.Schema.ObjectId,
                ref:"Track",
                required:true
            }
        }
    ],
    acceptedOrder:[
        {
            TrackId:{
                type:mongoose.Schema.ObjectId,
                ref:"Track",
                required:true
            }
        }
    ],
    completedOrder:[
        {
            TrackId:{
                type:mongoose.Schema.ObjectId,
                ref:"Track",
                required:true
            }
        }
    ],
    riderTotalWageArray:{
        type: [Number],
        default:new Array(12).fill(0)
    },
    riderTotalPaymentArray:{
        type: [Number],
        default:new Array(12).fill(0)
    },
    riderTotalRemainingArray:{
        type: [Number],
        default:new Array(12).fill(0)
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date
},{timestamps:true});
const Rider=new mongoose.model('Rider',riderSchema);
module.exports=Rider;