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

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");
        app.listen(process.env.PORT || 5000, () => {
            console.log("Server running on port 5000");
        });
    })
    .catch(err => console.log("Database Error:", err));