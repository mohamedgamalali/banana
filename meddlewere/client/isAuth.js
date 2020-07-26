const jwt = require('jsonwebtoken');

const Client = require('../../models/client');

module.exports = async (req,res,next)=>{
    try{
    const authHeader = req.get('Authorization');
    if(!authHeader){
        const error = new Error('not Authorized!!');
        error.statusCode = 401;
        throw error;
    }
    const token =req.get('Authorization').split(' ')[1];
    
    let decodedToken;
    

        decodedToken = jwt.verify(token,process.env.JWT_PRIVATE_KEY_CLIENT);

        if(!decodedToken){
            const error = new Error('not Authorized!!');
            error.statusCode = 401;
            throw error;
        }

        const client   = await Client.findById(decodedToken.userId) ;

        if(!client){
            const error = new Error('user not found');
            error.statusCode = 404 ;
            throw error ;
        }

        if(client.blocked==true){
            const error = new Error('client have been blocked');
            error.statusCode = 403 ;
            throw error ;
        }
            
        req.userId = decodedToken.userId;
       
        next();

    } catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
    
};