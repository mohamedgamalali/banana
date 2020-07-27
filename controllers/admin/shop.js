const { validationResult } = require("express-validator");
const path = require("path");

const deleteFile = require("../../helpers/file");
const Admin = require("../../models/admin");
const Products = require("../../models/products");

exports.getProducts = async (req, res, next) => {
    const catigory = req.params.catigoryId;
    const page = req.query.page || 1;
    const productPerPage = 10;
    const filter = req.query.filter || "0";
    const date = req.query.date || "0";
    const sold = req.query.sold || "0";
    let totalProducts;
    let products;
    let find = {};

    try {
        if (filter == '0') {
            find = { category: catigory }
        } else {
            find = { category: catigory, productType: { $in: filter } }
        }
        if (date == '1' && sold == '0') {
            totalProducts = await Products.find(find).countDocuments();
            products = await Products.find(find)
                .sort({ createdAt: -1 })
                .skip((page - 1) * productPerPage)
                .limit(productPerPage);
        } else if (date == '1' && sold == '1') {
            totalProducts = await Products.find(find).countDocuments();
            products = await Products.find(find)
                .sort({ createdAt: -1, orders: -1 })
                .skip((page - 1) * productPerPage)
                .limit(productPerPage);
        } else if (date == '0' && sold == '1') {
            totalProducts = await Products.find(find).countDocuments();
            products = await Products.find(find)
                .sort({ orders: -1 })
                .skip((page - 1) * productPerPage)
                .limit(productPerPage);
        }


        res.status(200).json({
            state: 1,
            data: {
                products: products
            },
            totalProducts: totalProducts,
            message: `products in page ${page}, filter ${filter}, date ${date} and sold ${sold}`
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.putProduct = async (req, res, next) => {
    const imageUrl = req.files;
    const name_en = req.body.nameEn;
    const name_ar = req.body.nameAr;
    const productType = req.body.productType;
    const category = req.body.category;
    const errors = validationResult(req);
    let creaated = false;

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            throw error;
        }
        if(category!='F-V'&& category!='B'&& category!='F-M' && category!='F'){
            const error = new Error(`invalid category input`);
            error.statusCode = 422;
            throw error;
        }
        if(imageUrl.length==0){
            const error = new Error(`validation faild for imageUrl you must insert image`);
            error.statusCode = 422;
            throw error;
        }
        const newProduct = new Products({
            category:category,
            name_en:name_en,
            name_ar:name_ar,
            productType:productType,
            imageUrl:imageUrl[0].path
        });
        const product = await newProduct.save();
        creaated = true ;
        res.status(201).json({
            state:1,
            data:{
                product:product
            },
            message:'product created'
        })

    } catch (err) {
        if(imageUrl.length>0 && creaated == false){
            deleteFile.deleteFile(imageUrl[0].path);
        }
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};