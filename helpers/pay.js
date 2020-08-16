const https = require('https');
const querystring = require('querystring');

exports.reqq =   async (cb)=>{
    try{
        var path='/v1/checkouts';
        var data = querystring.stringify( {
            'entityId':'8a8294174d0595bb014d05d82e5b01d2',
            'amount':'92.00',
            'currency':'EUR',
            'paymentType':'DB'
        });
        var options = {
            port: 443,
            host: 'https://test.oppwa.com',
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length,
                'Authorization':'Bearer OGE4Mjk0MTc0ZDA1OTViYjAxNGQwNWQ4MjllNzAxZDF8OVRuSlBjMm45aA=='
            }
        };
        var postRequest = https.request(options, function(res) {
            console.log();
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                jsonRes = JSON.parse(chunk);
                return cb(jsonRes);
            });
        });
        postRequest.write(data);
        postRequest.end();
    }catch(err){
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        throw err
    }
    
}