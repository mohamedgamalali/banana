const { validationResult } = require("express-validator");
const path = require("path");

const deleteFile = require("../../helpers/file");
const Admin = require("../../models/admin");
const Products = require("../../models/products");
const Seller = require("../../models/seller");

exports.getProducts = async (req, res, next) => {
    const catigory = req.params.catigoryId;
    const page = req.query.page || 1;
    const productPerPage = 10;
    const filter = req.query.filter || false;
    const date = req.query.date || "0";
    const sold = req.query.sold || "0";
    let totalProducts;
    let products;
    let find = {};

    try {
        if (!filter) {
            find = { category: catigory };
        } else {
            find = { category: catigory, productType: { $in: filter } };

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
                .sort({ orders: -1, createdAt: -1 })
                .skip((page - 1) * productPerPage)
                .limit(productPerPage);
        } else if (date == '0' && sold == '1') {
            totalProducts = await Products.find(find).countDocuments();
            products = await Products.find(find)
                .sort({ orders: -1 })
                .skip((page - 1) * productPerPage)
                .limit(productPerPage);
        } else if (date == '0' && sold == '0') {
            totalProducts = await Products.find(find).countDocuments();
            products = await Products.find(find)
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

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            throw error;
        }
        if (category != 'F-V' && category != 'B' && category != 'F-M' && category != 'F') {
            const error = new Error(`invalid category input`);
            error.statusCode = 422;
            throw error;
        }
        if (imageUrl.length == 0) {
            const error = new Error(`validation faild for imageUrl you must insert image`);
            error.statusCode = 422;
            throw error;
        }
        const newProduct = new Products({
            category: category,
            name_en: name_en,
            name_ar: name_ar,
            productType: productType,
            imageUrl: imageUrl[0].path
        });
        const product = await newProduct.save();
        res.status(201).json({
            state: 1,
            data: {
                product: product
            },
            message: 'product created'
        })

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.postEditProduct = async (req, res, next) => {
    const imageUrl = req.files;
    const name_en = req.body.nameEn;
    const name_ar = req.body.nameAr;
    const productType = req.body.productType;
    const category = req.body.category;
    const productId = req.body.productId;
    const errors = validationResult(req);

    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            throw error;
        }
        if (category != 'F-V' && category != 'B' && category != 'F-M' && category != 'F') {
            const error = new Error(`invalid category input`);
            error.statusCode = 422;
            throw error;
        }
        if (Number(productType) > 13 || Number(productType) < 1) {
            const error = new Error(`invalid productType input`);
            error.statusCode = 422;
            throw error;
        }
        const product = await Products.findById(productId);
        if (!product) {
            const error = new Error(`product not found`);
            error.statusCode = 404;
            throw error;
        }
        product.name_ar = name_ar;
        product.name_en = name_en;
        product.productType = productType;
        product.category = category;

        if (imageUrl.length > 0) {
            deleteFile.deleteFile(path.join(__dirname + '/../../' + product.imageUrl));
            product.imageUrl = imageUrl[0].path;
        }

        const editedProduct = await product.save();

        res.status(200).json({
            state: 1,
            data: {
                product: editedProduct
            },
            message: 'product edited'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.deleteProduct = async (req, res, next) => {

    const productId = req.body.productId;
    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            throw error;
        }
        if (!Array.isArray(productId)) {
            const error = new Error(`productId must be array of IDs`);
            error.statusCode = 422;
            throw error;
        }
        const product = await Products.find({ _id: { $in: productId } });
        if (product.length != productId.length) {
            const error = new Error(`products not found`);
            error.statusCode = 404;
            throw error;
        }
        product.forEach(p => {
            deleteFile.deleteFile(path.join(__dirname + '/../../' + p.imageUrl));
        });

        await Products.deleteMany({ _id: { $in: productId } });

        res.status(200).json({
            state: 1,
            message: `${productId.length} items deleted`,
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getSingleProduct = async (req, res, next) => {

    const productId = req.params.id;

    try {
        const product = await Products.findById(productId);
        if (!product) {
            const error = new Error('product not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            state: 1,
            data: product,
            message: 'all product data'
        });


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getCertificate = async (req, res, next) => {

    const page = req.query.page || 1;
    const productPerPage = 10;

    try {
        const seller = await Seller.find({ category: { $elemMatch: { review: false } } })
            .skip((page - 1) * productPerPage)
            .limit(productPerPage)
            .select('name mobile email category');

        const total = await Seller.find({ category: { $elemMatch: { review: false } } }).countDocuments();

        res.status(200).json({
            state: 1,
            data: seller,
            total: total,
            message: 'Certificates need approve'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getSingleUserCertificates = async (req, res, next) => {

    const sellerId = req.params.sellerId;

    try {

        const seller = await Seller.findById(sellerId)
        .select('name mobile email category');
        if (!seller) {
            const error = new Error('seller not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            state:1,
            data:seller,
            message:'all seller certificates'
        })


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};



exports.postApproveCertificate = async (req, res, next) => {

    const sellerId = req.body.sellerId;
    const certificateId = req.body.CertificateId;
    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error(`validation faild for ${errors.array()[0].param} in ${errors.array()[0].location}`);
            error.statusCode = 422;
            throw error;
        }
        
        const seller = await Seller.findById(sellerId).select('category');
        if(!seller){
            const error = new Error('seller not found');
            error.statusCode = 404;
            throw error;
        }
        await seller.certApprove(certificateId);


        res.status(200).json({
            state: 1,
            message: `certificate approved`,
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};