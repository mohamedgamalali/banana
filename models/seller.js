const mongoose = require('mongoose');

const deleteFile = require("../helpers/file");

const schema = mongoose.Schema;

const sellerSchema = new schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    image:{
        type: Number,
        default: 1
    },
    category:[{
        name:{
            type:String,
            enum: ['F-V', 'B', 'F-M','F'],
            required:true,
        },
        activated:{
            type:Boolean,
            default:false
        },
        review:{
            type:Boolean,
            default:false
        },
        certificate:{
            image:{
                type:String,
                default:'0'
            },
            expiresAt:{
                type:Number,
                default:0
            },
            state:{
                type:String,
                enum:['binding','approve','disapprove'],
                default:'binding'
            },
            adminNote:String,
        }
        
    }],
    verfication: {
        type: Boolean,
        default: false
    },
    blocked: {
        type: Boolean,
        default: false
    },
    wallet: {
        type: Number,
        default: 0
    },
    FCMJwt: [{
        type: String
    }],
    sendNotfication: {
        type: Boolean,
        default: true
    },
    rate: {
        type: Number,
        default: 0
    },
    updated:{
        type:String,
        required:true
    }
});

sellerSchema.methods.addSert = function (categoryId,imageUrl,expires){
    let cat = this.category ;

    cat.forEach(element => {
        if(element._id == categoryId){

            if(element.certificate.image!='0'){
                deleteFile.deleteFile(__dirname + '/../' + element.certificate.image )
            }
            element.certificate.image     =  imageUrl ;
            element.certificate.expiresAt =  expires ;
            element.certificate.state     =  'binding' ;
            element.activated = false ;
            element.review = false ;
        }
    });
    this.category = cat ;
    return this.save()  ;
}

module.exports = mongoose.model('seller', sellerSchema);