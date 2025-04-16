// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/users.model.js';

// Middleware to check if user is authenticated
export const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(403).json({ error: 'Access Denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid Token' });
        req.user = user;
        next();
    });
};

// Middleware to check if user has a specific role
export const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        const user = req.user; // user data from the JWT token
        if (!user || !allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: 'Access Denied' });
        }
        next();
    };
};

export const authenticateUser = async (req, res, next) => {
    try {
        // 1. Get token from cookies or Authorization header
        const token = req.cookies?.accessToken ||
            req.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                message: 'Not authorized - No token provided',
                success: false
            });
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Get user and attach to request
        const user = await User.findById(decoded._id).select('-password');

        if (!user) {
            return res.status(401).json({
                message: 'Not authorized - User not found',
                success: false
            });
        }

        req.user = user; // This is crucial!
        next();
    } catch (error) {
        console.error('Authentication error:', error);

        let message = 'Not authorized';
        if (error.name === 'TokenExpiredError') {
            message = 'Session expired, please login again';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Invalid token';
        }

        return res.status(401).json({
            message,
            success: false
        });
    }
};