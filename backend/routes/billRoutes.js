const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill.");

router.get("/", async (req, res) => {
    try {
        const bills = await Bill.find().sort({ billDate: -1 });
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { customerName, phone, items, discount = 0 } = req.body;

        if (!customerName || !customerName.trim() || !items?.length)
            return res.status(400).json({ message: "Enter customer and cake details" });

        if (!Number.isFinite(Number(discount)) || Number(discount) < 0)
            return res.status(400).json({ message: "Invalid discount" });

        if (items.some(i => !i.cakeName ||
            !Number.isFinite(Number(i.quantity)) || Number(i.quantity) <= 0 ||
            !Number.isFinite(Number(i.price)) || Number(i.price) < 0))
            return res.status(400).json({ message: "Invalid item details" });

        const subtotal = items.reduce(
            (sum, i) => sum + Number(i.quantity) * Number(i.price), 0
        );

        if (Number(discount) > subtotal)
            return res.status(400).json({ message: "Discount exceeds subtotal" });

        const bill = await Bill.create({
            customerName,
            phone,
            items: items.map(i => ({
                cakeName: i.cakeName,
                quantity: Number(i.quantity),
                price: Number(i.price),
                total: Number(i.quantity) * Number(i.price)
            })),
            subtotal,
            discount: Number(discount),
            grandTotal: subtotal - Number(discount)
        });

        res.status(201).json(bill);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const bill = await Bill.findByIdAndDelete(req.params.id);
        if (!bill) return res.status(404).json({ message: "Bill not found" });
        res.json({ message: "Bill deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;