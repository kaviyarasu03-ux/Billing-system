const express = require("express");
const router = express.Router();
const Cake = require("../models/Cake");

router.get("/", async (req, res) => {
    try {
        const cakes = await Cake.find();
        res.json(cakes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const cake = await Cake.create(req.body);
        res.status(201).json(cake);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const cake = await Cake.findByIdAndUpdate(
            req.params.id, req.body, { new: true, runValidators: true }
        );
        if (!cake) return res.status(404).json({ message: "Cake not found" });
        res.json(cake);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const cake = await Cake.findByIdAndDelete(req.params.id);
        if (!cake) return res.status(404).json({ message: "Cake not found" });
        res.json({ message: "Cake deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;