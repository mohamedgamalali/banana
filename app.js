const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

require('dotenv').config();

const app = express();


const MONGODB_URI = process.env.MONGODB_URI;

const port = process.env.PORT || 8080;

 //multer
 const fileStorage = multer.diskStorage({
  destination:(req,file,cb)=>{
      cb(null,'images');
  },
  filename:(req,file,cb)=>{
    cb(null,new Date().toISOString()+'-' + file.originalname);
  }
});




const fileFilter = (req,file,cb)=>{
  if(file.mimetype==='image/png'||
  file.mimetype==='image/jpg'   ||
  file.mimetype==='image/jpeg'){
      cb(null,true);
  }else {
    cb(null,false);
  }
}

//meddleWere
app.use(bodyParser.json());

//multer meddlewere
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).array('image'));
app.use('/images',express.static(path.join(__dirname,'images')));

//headers meddlewere
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    next();
});

//routes
const router          = require('./routes/router');
const erorrMeddlewere = require('./helpers/errors');



app.use('/client', router.client.auth, router.client.shop,router.client.user);
app.use('/seller', router.seller.auth,router.client.shop);
app.use('/admin', router.admin.auth, router.admin.shop);


//error handle meddlewere
app.use(erorrMeddlewere);


mongoose
    .connect(
        MONGODB_URI, {
        useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false
    }
    )
    .then(result => {
        const server = app.listen(port);
        const io = require('./socket.io/socket').init(server);
        io.on('connection', socket => {
            console.log("Clint connected");
        })
    })
    .catch(err => {
        console.log(err);
    });