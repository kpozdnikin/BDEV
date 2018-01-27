import jwt from 'jsonwebtoken';
import promisify from 'promisify-native';

const verifyJwt = promisify(jwt.verify);

export default async function (req, res, next) {
    const token = req.headers['x-access-token'] || req.body.forgot_password_token || req.query.token;
    try {
        req.decoded = await verifyJwt(token, config.jwt.secret);
    } catch (error) {
        req.jwtError = error;
    }
    next();
}
