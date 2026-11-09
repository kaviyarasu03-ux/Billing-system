const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const cakeRoutes = require("./routes/cakeRoutes");
const billRoutes = require("./routes/billRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Bakery Cake Billing System API is Running!");
});

app.use("/api/cakes", cakeRoutes);
app.use("/api/bills", billRoutes);

async function start() {
    if (!process.env.MONGO_URI) {
        throw new Error("Set MONGO_URI before starting the API");
    }
    await mongoose.connect(process.env.MONGO_URI);
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