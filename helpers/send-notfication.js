const admin = require("firebase-admin");

const io = require("../socket.io/socket");

const Notfication = require('../models/notfications');

const Client = require('../models/client');

const Seller = require('../models/seller');


const send = async (data, notfi, user, path) => {
  try {
    let index = -1;
    admin.apps.forEach((app, ind) => {
      if (app.name == path) {
        index = ind;
      }
    });

    user.forEach(async i => {
      const notfication = new Notfication({
        path: path,
        user: i._id,
        data: data,
        notification: notfi,
        date: new Date().getTime().toString()
      });

      await notfication.save();

      io.getIO().emit("notfication", {
        action: "notfication",
        userId: i._id,
        notfications: {
          data: data,
          notification: notfi,
        },
      });
      let message = {};
      if (i.lang == 'ar') {
        message = {
          notification: {
            title: notfi.title_ar,
            body: notfi.body_ar,
          },
          data: data,
          android: {
            notification: {
              sound: "default",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
          topic: "X",
          tokens: i.FCMJwt,
        };
      } else if (i.lang == 'en') {
        message = {
          notification: {
            title: notfi.title_en,
            body: notfi.body_en,
          },
          data: data,
          android: {
            notification: {
              sound: "default",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
          topic: "X",
          tokens: i.FCMJwt,
        };
      }

      if(i.FCMJwt.length>0){
        const messageRes = await admin.apps[index].messaging().sendMulticast(message);
        console.log(messageRes);
      }

    });

  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    throw err;
  }
};

const sendAll = async (data, notfi, path) => {
  try {

    let users;
    if (path == 'client') {
      users = await Client.find({}).select('FCMJwt lang')

    } else if (path == 'seller') {
      users = await Seller.find({}).select('FCMJwt lang')
    }

    await send(data, notfi, users, path);

    return 'done';

  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    throw err;
  }
};

exports.send = send;
exports.sendAll = sendAll;
