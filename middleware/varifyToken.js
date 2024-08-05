const jwt = require('jsonwebtoken');
const JWT_KEY = "e-comm";

const authMiddleware = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send({ message: "Access Denied" });

    try {
        const verified = jwt.verify(token, JWT_KEY);
        req.user = verified; // Add the verified user data to the request
        next();
    } catch (err) {
        res.status(400).send({ message: "Invalid Token" });
    }
};

module.exports = authMiddleware;
