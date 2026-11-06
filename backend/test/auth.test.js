const test = require("node:test");
const assert = require("node:assert/strict");
const { authenticate, requireRole } = require("../middleware/auth");

function responseMock() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test("authentication rejects requests without a bearer token", async () => {
    const res = responseMock();
    let continued = false;

    await authenticate({ get: () => undefined }, res, () => {
        continued = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(continued, false);
});

test("authentication rejects malformed bearer tokens", async () => {
    process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
    const res = responseMock();
    let continued = false;

    await authenticate({ get: () => "Bearer invalid-token" }, res, () => {
        continued = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(continued, false);
});

test("admin-only routes reject customer accounts", () => {
    const res = responseMock();
    let continued = false;

    requireRole("admin")({ user: { role: "customer" } }, res, () => {
        continued = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(continued, false);
});

test("admin-only routes allow admin accounts", () => {
    const res = responseMock();
    let continued = false;

    requireRole("admin")({ user: { role: "admin" } }, res, () => {
        continued = true;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(continued, true);
});
