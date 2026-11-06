const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticate(req, res, next) {
    const authorization = req.get("authorization");
    const token = authorization?.startsWith("Bearer ")
        ? authorization.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({ message: "Sign in to continue" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.sub);

        if (!user || user.role !== payload.role) {
            return res.status(401).json({ message: "Your session is no longer valid" });
        }
        if ((user.passwordVersion || 0) !== payload.passwordVersion) {
            return res.status(401).json({ message: "Your session is no longer valid" });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Your session has expired. Sign in again." });
        }
        next(err);
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (req.user?.role !== role) {
            return res.status(403).json({ message: "You do not have permission to do that" });
        }
        next();
    };
}

module.exports = { authenticate, requireRole };
