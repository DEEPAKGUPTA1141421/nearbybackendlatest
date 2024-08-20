const express = require("express");
const app = express();
const WebSocket = require("ws");
const bcrypt = require("bcrypt");
// async function createNode() {
//   const session = driver.session();
//   const fullname="deepak",role="user";
//   const email="iamtestmail@.com";
//   const password="12345678",image="http://localhostimg.png";
//   const hashPassworded=await bcrypt.hash(password,10);
//   const name="samsung",description="it is a good product";
  // const newnode=await session.run(`CREATE (p:Product{
  //   name:$name,
  //   description:$description
  //   })RETURN p`,{
  //     name:name,
  //     description:description
  //   })
  //   await session.run(`
  //     MATCH (u:User {email:$email})
  //     MATCH (p:Product {elementId:$elementId})
  //     CREATE (u)-[:cart_list]->(p)
  //     `,{
  //       email:email,
  //       elementId:newnode.records[0].get('p').elementId
  //   })

    //console.log(newnode.records[0].get('p').elementId);
    // const findUser=await session.run(`
    //   MATCH (u:User {email:$email})
    //   RETURN u`,{
    //     email:email
    //   })
    //   console.log(findUser.records[0].get('u'));
    // const newnode = await session.run(`
    //   CREATE (p:Product {
    //     name: $name,
    //     description: $description
    //   }) 
    //   RETURN p`, {
    //     name: name,
    //     description: description
    // });
    
    // const productNode = newnode.records[0].get('p');
    
    // Use the internal node ID to reference the newly created product node
    // await session.run(`
    //   MATCH (u:User {email: $email})
    //   MATCH (p:Product) WHERE id(p) = $productId
    //   CREATE (u)-[:cart_list]->(p)
    // `, {
    //   email: email,
    //   productId: productNode.identity.low  // Use .low for 64-bit integer support
    // });
    
  //   try {
  //     const result = await session.run(`
  //         MATCH (u:User)-[r:cart_list]->(p:Product)
  //         RETURN u, r, p
  //     `);

  //     const relationships = result.records.map(record => ({
  //         user: record.get('u').properties,
  //         relationship: record.get('r').type,
  //         product: record.get('p').properties
  //     }));

  //     console.log('Cart List Relationships:', relationships);

  //     return relationships;
  // } catch (error) {
  //     console.error('Something went wrong:', error);
  // }
  

  // await session.run(`CREATE (u:User
  //   {
  //     fullname:$fullname,
  //     email:$email,
  //     password:$hashPassworded,
  //     image:$image,
  //     resetPasswordToken: NULL,
  //     resetPasswordTime: NULL,
  //     latitude: NULL,
  //     longitude: NULL
  //   }
  //   )`,{
  //     fullname:fullname,
  //     email:email,
  //     hashPassworded:hashPassworded,
  //     image:image,
  //     role:role
  //   })
 
  // const address={
  //    country:"India",
  //    city:"banglore",
  //    address1:"address1",
  //    address2:"address2",
  //    postalCode:"54677",
  //    addressType:"AddressType"
  // }
  //try{
    // const createAddressResult=await session.run(`CREATE (a:Address {
    //   country:$country,
    //   city:$city,
    //   address1:$address1,
    //   address2:$address2,
    //   postalCode:$postalCode,
    //   addressType:$addressType
    //   })RETURN a`,{
    //     country:address.country,
    //     city:address.city,
    //     address1:address.address1,
    //     address2:address.address2,
    //     postalCode:address.postalCode,
    //     addressType:address.addressType
    //   });
    //   console.log(createAddressResult);
    //   const addressNode = createAddressResult.records[0].get('a');
    //   await session.run(`
    //   MATCH (t:User {email:$email}) 
    //   MATCH (a:Address {id:$addressId})
    //   CREATE (t)-[:HAS_ADDRESS]->(a)
    //   `,{
    //     email:email,
    //     addressId:addressNode.identity.low
    //   })
  // }
  // catch(err){
  //   console.log(err.message);
  // }
  // return;
    
//   try {
    
//     const response=await session.run(`MATCH (n:Address) RETURN n `);
//     const records=response.records;
//     records.forEach((n)=>{
//       const node=n.get('n');
//       console.log(node);
//     })
//       //await session.run('CREATE (a:Person {name: $name})', { name: 'Alice' })
//       //console.log("Success in creating node",response);
//   }
//   catch(err){
//     console.log(err.message);
//   }
//   finally {
//       await session.close()
//   }
// }
//createNode().catch(error => console.error(error)).then(() => driver.close())

const { WebSocketServer } = require("ws");
const path = require("path");
const cookie = require("cookie-parser");
var jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const fileupload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const cors = require("cors");
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
const { imageFileUpload } = require("./config/fileupload");
const driver = require("./config/neo4j");

app.use(cookie());
dotenv.config();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(fileupload());

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

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Api Running SuccessFully",
  });
});
app.post("/test",async(req,res,next)=>{
   await imageFileUpload(req,res);
})
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

const httpServer = app.listen(process.env.PORT, () => {
  console.log("server is running on port " + process.env.PORT);
});
const allchatparticipation = new Map();
const userToSocket = new Map();
const socketToUser = new Map();

const wss = new WebSocketServer({ server: httpServer });
const Welcome_Type="Welcome_Type";
wss.on('connection', function connection(currentsocket) {
  currentsocket.on('error', console.error);
  console.log("User connected");

  currentsocket.on('message', function message(data, isBinary){
    try {
      const parsedData = JSON.parse(data);

      if (parsedData.type === "setUserId"){
        console.log("SETuSERiuD");
        socketToUser.set(currentsocket, parsedData.userId);
        userToSocket.set(parsedData.userId, currentsocket);
        
      }
      else if(parsedData.type === "selectChat"){
        console.log("selectChat",parsedData);
        allchatparticipation.set(socketToUser.get(currentsocket),parsedData.userArray);
        console.log("selectChat");
      } 
      else if (parsedData.type === "sendMessage") {
        console.log(parsedData);
        const userArray = allchatparticipation.get(socketToUser.get(currentsocket));

        userArray.forEach((elem) => {
          const userSocket = userToSocket.get(elem);
          if (userSocket && userSocket !== currentsocket && userSocket.readyState === WebSocket.OPEN) {
            userSocket.send(JSON.stringify(parsedData.message));
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  currentsocket.on('close', () => {
    const userId = socketToUser.get(currentsocket);
    if (userId) {
      socketToUser.delete(currentsocket);
      userToSocket.delete(userId);
      allchatparticipation.delete(userId);
    }
    console.log("User disconnected and cleaned up");
  });
  currentsocket.send(JSON.stringify({ message: 'Hello! Message From Server!!',type:Welcome_Type }));
});
