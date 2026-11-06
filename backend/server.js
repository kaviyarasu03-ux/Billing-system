const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const cakeRoutes = require("./routes/cakeRoutes");
const billRoutes = require("./routes/billRoutes");
const authRoutes = require("./routes/authRoutes");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const { authenticate, requireRole } = require("./middleware/auth");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Bakery Cake Billing System API is Running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/cakes", authenticate, cakeRoutes);
app.use("/api/bills", authenticate, requireRole("admin"), billRoutes);

async function ensureAdminAccount() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD to provision the admin account");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("ADMIN_EMAIL must be a valid email address");
    }
    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
        throw new Error("ADMIN_PASSWORD must be 12-72 bytes long");
    }

    const existing = await User.findOne({ email });
    if (existing) {
        if (existing.role !== "admin") {
            throw new Error("ADMIN_EMAIL belongs to a customer account; choose a different admin email");
        }
        return;
    }

    await User.create({
        name: "Bakery Admin",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "admin"
    });
    console.log("Initial admin account created");
}

async function start() {
    if (!process.env.MONGO_URI) {
        throw new Error("Set MONGO_URI before starting the API");
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error("Set JWT_SECRET to a random secret of at least 32 characters");
    }

    await mongoose.connect(process.env.MONGO_URI);
    await ensureAdminAccount();
    console.log("MongoDB Connected Successfully");
    const port = process.env.PORT || 5000;
    app.listen(port, "0.0.0.0", () => {
        console.log(`Server running on port ${port}`);
    });
}

start().catch(err => {
    console.error("Server startup failed:", err.message);
    process.exitCode = 1;
});