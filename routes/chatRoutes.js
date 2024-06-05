const express=require('express');
const { accesschat, fetchchat, sendmessage, allmessage } = require('../controller/chatController');
const {isAuthenticated} = require("../middleware/authorised");
const router=express.Router();
router.get('/accesschat/:receiverId',isAuthenticated,accesschat);
router.get("/fetchchat",isAuthenticated,fetchchat);
router.post('/sendmessage/:chatId',isAuthenticated,sendmessage);
router.get("/allmessage/:chatId",isAuthenticated,allmessage);
module.exports=router;