const express = require("express");
const app = express();
const path=require("path");
const createserver = require("http");
const createServer = createserver.createServer;
const cookie = require("cookie-parser");
var jwt = require("jsonwebtoken");
const socket = require("socket.io");
const SocketServer = socket.Server;
const bodyParser = require("body-parser");
const fileupload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const shopRoutes = require("./routes/shopRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const deliveryAgentRoutes = require("./routes/deliveryAgentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const errorHandler = require("./utils/errorHanler");
const connectDb = require("./config/database");
const cors = require("cors");
app.use(cookie());
dotenv.config();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(fileupload());
// app.use(cors({
//   origin: "*", // Allow requests from any origin
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Add all the request methods you want to allow
//   credentials: true
// }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

cloudinary.config({
  cloud_name: "drt8pxy1q",
  api_key: "578449198298885",
  api_secret: "TDSnd4NoPgZ9NdsUz9LaRg5u8oU",
});

app.use("/uploads", express.static("uploads"));
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/shop", shopRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/rider", deliveryAgentRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/chat", chatRoutes);

app.use(errorHandler);
connectDb();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});
io.on("connection", (socket) => {
  console.log("user Connected", socket.id);
  socket.on("setup", (user) => {
    socket.join(user._id);
    // console.log(user name ${user.fullname} connected);
    socket.emit("connected");
  });
  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
  });
  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
  });
  socket.on("join chat", (chat) => {
    socket.join(chat);
    // console.log(user joined chat room ${chat});
  });
  socket.on("room:join", (data) => {
    console.log("data is ", data);
    io.to(socket.id).emit("room:join",data);
  });
  
  socket.on("new message", (newMessageReceived) => {
    console.log("newmessage", newMessageReceived);

    var chat = newMessageReceived.chat;
    if (!chat.users) {
      console.log("chat.users not define");
    } else {
      console.log(chat.users);
      for (let i = 0; i < chat.users.length; i++) {
        console.log(i);
        if (chat.users[i] === newMessageReceived.sender) {
          console.log("i am sender", chat.users[i], newMessageReceived.sender);
        } else {
          console.log("user getting the message", chat.users[i]);
          socket.in(chat.users[i]).emit("message received", newMessageReceived);
        }
      }
    }
  });
});


//--------------------deployement------------------
const __dirname1=path.resolve();
if(process.env.NODE_ENV==="production"){
   app.use(express.static(path.join(__dirname1,"frontend/build")));
   app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname1,"frontend","build","index.html"));
   })
}
else{
  app.get("/",(req,res)=>{
    res.status(200).json({
      success:true,
      message:"Api Running SuccessFully"
    })
  })
}

//----------------------deployment--------------------
server.listen(process.env.PORT, () => {
  console.log("server is running on port " + process.env.PORT);
});
module.exports = app;
