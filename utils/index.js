require('dotenv').config();
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const JWKS_URI = process.env.JWKS_URI;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;
const JWT_ISSUER = process.env.JWT_ISSUER;
const NODE_ENV = process.env.NODE_ENV;

module.exports = {
    asyncHandler: (cb) => {
        return async(req, res, next) => {
            try {
                await cb(req, res, next)
            } catch(error){
                console.log(error);
                if (error.name === 'ValidationError') {
                    return res.status(400).send(error);
                } else {
                    res.status(500).send(error);
                }
            }
        }
    },

    // checkJwt: jwt({
    //     secret: jwksRsa.expressJwtSecret({
    //         cache: true,
    //         rateLimit: true,
    //         jwksRequestsPerMinute: 5,
    //         jwksUri: JWKS_URI
    //     }),
    
    //     audience: JWT_AUDIENCE,
    //     issuer: JWT_ISSUER,
    //     algorithms: ["RS256"]
    // })

    checkJwt: (req, res, next) => {
        if (NODE_ENV === 'dev') {
            return next();
        } else {
            return jwt({
                secret: jwksRsa.expressJwtSecret({
                    cache: true,
                    rateLimit: true,
                    jwksRequestsPerMinute: 5,
                    jwksUri: JWKS_URI
                }),
            
                audience: JWT_AUDIENCE,
                issuer: JWT_ISSUER,
                algorithms: ["RS256"]
            })
        }   
    }
}