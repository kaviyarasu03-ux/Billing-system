const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const Cake = require("../models/Cake");
const Bill = require("../models/Bill.");
const cakeRoutes = require("../routes/cakeRoutes");
const billRoutes = require("../routes/billRoutes");

test("cake and billing APIs are available without signing in", async () => {
    const originalCakeMethods = {
        find: Cake.find,
        create: Cake.create,
        findByIdAndUpdate: Cake.findByIdAndUpdate,
        findByIdAndDelete: Cake.findByIdAndDelete
    };
    const originalBillMethods = {
        find: Bill.find,
        create: Bill.create,
        findByIdAndDelete: Bill.findByIdAndDelete
    };

    Cake.find = async () => [];
    Cake.create = async cake => ({ ...cake, _id: "cake-id" });
    Cake.findByIdAndUpdate = async (id, cake) => ({ ...cake, _id: id });
    Cake.findByIdAndDelete = async id => ({ _id: id });
    Bill.find = () => ({ sort: async () => [] });
    Bill.create = async bill => ({ ...bill, _id: "bill-id" });
    Bill.findByIdAndDelete = async id => ({ _id: id });

    const app = express();
    app.use(express.json());
    app.use("/api/cakes", cakeRoutes);
    app.use("/api/bills", billRoutes);
    const server = app.listen(0);

    try {
        await new Promise(resolve => server.once("listening", resolve));
        const { port } = server.address();
        const baseUrl = `http://127.0.0.1:${port}/api`;
        const requests = [
            ["/cakes", { method: "GET" }, 200],
            ["/cakes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cakeName: "Test Cake",
                    category: "Other",
                    price: 10,
                    stock: 5
                })
            }, 201],
            ["/cakes/cake-id", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cakeName: "Updated Cake" })
            }, 200],
            ["/cakes/cake-id", { method: "DELETE" }, 200],
            ["/bills", { method: "GET" }, 200],
            ["/bills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: "Test Customer",
                    items: [{ cakeName: "Test Cake", quantity: 1, price: 10 }]
                })
            }, 201],
            ["/bills/bill-id", { method: "DELETE" }, 200]
        ];

        for (const [path, options, expectedStatus] of requests) {
            const response = await fetch(`${baseUrl}${path}`, options);
            assert.equal(response.status, expectedStatus, `${options.method} ${path}`);
        }
    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
        Object.assign(Cake, originalCakeMethods);
        Object.assign(Bill, originalBillMethods);
    }
});
