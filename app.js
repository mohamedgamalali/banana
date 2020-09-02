const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const schedule = require('node-schedule');


require('dotenv').config();

const app = express();


const MONGODB_URI = process.env.MONGODB_URI;

const port = process.env.PORT || 8080;

//multer
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});




const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

//meddleWere
app.use(bodyParser.json());

//multer meddlewere
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).array('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

//headers meddlewere
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    next();
});

//routes
const router = require('./routes/router');
const erorrMeddlewere = require('./helpers/errors');


app.use('/client', router.client.auth, router.client.shop, router.client.user, router.client.support);
app.use('/client/guest', router.client.guest);
app.use('/seller', router.seller.auth, router.seller.shop, router.seller.user, router.seller.support);
app.use('/admin', router.admin.auth, router.admin.shop, router.admin.user,router.admin.support);

//error handle meddlewere
app.use(erorrMeddlewere);


mongoose
    .connect(
        MONGODB_URI, {
        useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false
    })
    .then(result => {
        const server = app.listen(port);
        const io = require('./socket.io/socket').init(server);
        io.on('connection', socket => {
            console.log("Clint connected");
        })
        //run scadual stuff
        const Scad = mongoose.model('scheduleCert');
        return Scad.find({ expiresin: { $gt: new Date().getTime() } })
    })
    .then(s => {
        //console.log(s);
        const Scad = mongoose.model('scheduleCert');
        s.forEach(task => {
            const Seller = mongoose.model('seller');
            schedule.scheduleJob(new Date(task.expiresin).getTime(), async (fireDate) => {
                console.log('scadual');
                const seller = await Seller.findById(task.seller._id).select('category')
                await seller.certExpired();
            });
        })
        return Scad.deleteMany({ expiresin: { $lt: new Date().getTime() } })

    })
    .then(result => {
        const SccadPay = mongoose.model('ScadPay');
        return SccadPay.find({ fireIn: { $gt: new Date().getTime() } })
    })
    .then(er => {
        const Seller = mongoose.model('seller');
        const SccadPay = mongoose.model('ScadPay');
        er.forEach(item => {


            schedule.scheduleJob(item._id.toString(), new Date(item.fireIn).getTime(), async function () {
                const seller = await Seller.findById(item.seller._id).select('wallet bindingWallet');
                if (seller.bindingWallet >= item.price) {
                    seller.bindingWallet = seller.bindingWallet - item.price;
                    seller.wallet += item.price;
                    await seller.save();
                    const sss = await SccadPay.findById(s._id)
                    sss.delever = true;
                    await sss.save();
                }
            });
        })
        return SccadPay.deleteMany({ fireIn: { $lt: new Date().getTime() } })
    })
    .then(done => {
        console.log('schedule activated');
    })
    .catch(err => {
        console.log(err);
    });