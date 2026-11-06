const mongoose = require("mongoose");

const cakeSchema = new mongoose.Schema({
    cakeName: { type: String, required: true },
    category: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 }
});

module.exports = mongoose.model("Cake", cakeSchema);