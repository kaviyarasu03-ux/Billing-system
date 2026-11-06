const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");
const User = require("../models/User");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many sign-in attempts. Try again in 15 minutes." }
});
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many accounts created. Try again later." }
});
const passwordChangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many password change attempts. Try again later." }
});

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}

function createToken(user) {
    return jwt.sign(
        { role: user.role, passwordVersion: user.passwordVersion || 0 },
        process.env.JWT_SECRET,
        { subject: user.id, expiresIn: "8h" }
    );
}

function validPassword(password) {
    return typeof password === "string" &&
        password.length >= 12 &&
        Buffer.byteLength(password, "utf8") <= 72;
}

router.post("/register", registrationLimiter, async (req, res, next) => {
    const { name, email, password } = req.body || {};

    if (typeof name !== "string" || !name.trim() || name.trim().length > 80 ||
        typeof email !== "string" || email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        !validPassword(password)) {
        return res.status(400).json({
            message: "Enter a name, valid email, and password with at least 12 characters"
        });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        if (await User.exists({ email: normalizedEmail })) {
            return res.status(409).json({ message: "An account with that email already exists" });
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash: await bcrypt.hash(password, 12),
            role: "customer"
        });

        res.status(201).json({
            token: createToken(user),
            user: publicUser(user)
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "An account with that email already exists" });
        }
        next(err);
    }
});

router.post("/login", loginLimiter, async (req, res, next) => {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "Enter your email and password" });
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).json({ message: "Password is too long" });
    }

    try {
        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+passwordHash");

        if (!user || !await bcrypt.compare(password, user.passwordHash)) {
            return res.status(401).json({ message: "Email or password is incorrect" });
        }

        res.json({
            token: createToken(user),
            user: publicUser(user)
        });
    } catch (err) {
        next(err);
    }
});

router.get("/me", authenticate, (req, res) => {
    res.json({ user: publicUser(req.user) });
});

router.patch(
    "/change-password",
    authenticate,
    requireRole("admin"),
    passwordChangeLimiter,
    async (req, res, next) => {
        const { currentPassword, newPassword } = req.body || {};
        if (typeof currentPassword !== "string" ||
            Buffer.byteLength(currentPassword, "utf8") > 72 ||
            !validPassword(newPassword)) {
            return res.status(400).json({
                message: "Enter your current password and a new password with at least 12 characters"
            });
        }

        try {
            const user = await User.findById(req.user.id).select("+passwordHash");
            if (!user) {
                return res.status(401).json({ message: "Your account is no longer available" });
            }

            if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
                return res.status(401).json({ message: "Current password is incorrect" });
            }
            if (await bcrypt.compare(newPassword, user.passwordHash)) {
                return res.status(400).json({
                    message: "Choose a new password that is different from your current one"
                });
            }

            user.passwordHash = await bcrypt.hash(newPassword, 12);
            user.passwordVersion = (user.passwordVersion || 0) + 1;
            await user.save();

            res.json({ message: "Password updated. Sign in again with your new password." });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
