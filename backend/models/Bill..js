const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    phone: String,
    items: [{
        cakeName: String,
        quantity: Number,
        price: Number,
        total: Number
    }],
    subtotal: Number,
    discount: { type: Number, default: 0 },
    grandTotal: Number,
    billDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Bill", billSchema);