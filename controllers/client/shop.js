const Products = require('../../models/products');

/*const newOne =  new Products({
    category:'F-V',
    name_en:'banana',
    name_ar:'موز',
    productType:'1'
});
newOne.save().then(dd=>{
    console.log('done');
})*/

exports.getProducts = async (req, res, next) => {
    const catigory = req.params.catigoryId;
    const page = req.query.page || 1;
    const productPerPage = 10;
    const filter = req.query.filter || "0";
    const date = req.query.date  || "0";
    const sold = req.query.sold || "0";
    let totalProducts;
    let products;
    let find = {};

    try {
        if(filter=='0'){
            find = { category: catigory}
        }else{
            find = { category: catigory ,productType:{$in:filter} }
        }
        if(date=='1'&&sold=='0'){
            totalProducts  = await Products.find(find).countDocuments();
            products = await Products.find(find)
            .sort({createdAt:-1})
            .skip((page - 1) * productPerPage)
            .limit(productPerPage);
        }else if(date=='1'&&sold=='1'){
            totalProducts  = await Products.find(find).countDocuments();
            products = await Products.find(find)
            .sort({createdAt:-1,orders:-1})
            .skip((page - 1) * productPerPage)
            .limit(productPerPage);
        }else if(date=='0'&&sold=='1'){
            totalProducts  = await Products.find(find).countDocuments();
            products = await Products.find(find)
            .sort({orders:-1})
            .skip((page - 1) * productPerPage)
            .limit(productPerPage);
        }
        

        res.status(200).json({
            state:1,
            data:{
                products:products
            },
            totalProducts:totalProducts,
            message:`products in page ${page}, filter ${filter}, date ${date} and sold ${sold}`
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}