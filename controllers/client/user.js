const Client = require('../../models/client');
const Order = require('../../models/order');
const Products = require('../../models/products');

exports.getOrders = async (req, res, next) => {
    const page = req.query.page || 1;
    const productPerPage = 10;
    const filter = req.query.filter || 'started';
    try {
        const total  = await Order.find({client:req.userId,status:filter}).countDocuments();
        const orders = await Order.find({client:req.userId,status:filter})
        .select('location stringAdress arriveDate products')
        .populate({path:'products.product',select:'name name_en name_ar imageUrl'})
        .sort({ createdAt: -1 })
        .skip((page - 1) * productPerPage)
        .limit(productPerPage);

        res.status(200).json({
            state:1,
            data:{
                orders:orders
            },
            total:total,
            message:`orders in page ${page} sortder by date with filter ${filter}`
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postCancelOrder = async (req, res, next) => {
    const orderId = req.body.orderId;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            const error = new Error(`order not found`);
            error.statusCode = 404;
            error.state      = 9  ;
            throw error;
        }
        if (order.client.toString()!==req.userId.toString()) {
            const error = new Error('you are not the order owner!!');
            error.statusCode = 403;
            error.state      = 11 ;
            throw error;
        }
        if(order.status!='started'){
            const error = new Error('the order status != started');
            error.statusCode = 409;
            error.state      = 12 ;
            throw error;
        }
        await order.cancelOrder();

        res.status(200).json({
            state:1,
            message:'order canceled'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getMyFevList = async (req, res, next) => {
    let list = [] ;
    try {
        const client = await Client.findById(req.userId).select('fevProducts');
        client.fevProducts.forEach(i => {
            list.push({
                _id:i._id,
                name:i.list.name
            });
        });

        res.status(200).json({
            state:1,
            data:{
                lists:list 
            },
            message:'client fev lists'
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getMyfevProducts = async (req, res, next) => {
    const listId = req.params.id;

    try {
        const client = await Client.findById(req.userId).select('fevProducts');

        
        const ListProducts = client.fevProducts.filter(f=>{
            return f._id.toString() === listId.toString();
        });
        if(ListProducts.length==0){
            const error = new Error(`list not found`);
            error.statusCode = 404;
            error.state      = 9  ;
            throw error;
        }
        const products = await Products.find({_id:{$in:ListProducts[0].list.product}})
        .select('category name_en name_ar productType imageUrl');
        res.status(200).json({
            state:1,
            data:{
                products:products
            },
            message:`products in list ${listId}`
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}
