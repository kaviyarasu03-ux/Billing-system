import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
    .replace(/\/$/, "");
const api = axios.create({ baseURL: `${API_BASE_URL}/api` });

api.interceptors.request.use(config => {
    const token = localStorage.getItem("bakeryAuthToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(undefined, error => {
    const isAuthRequest = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRequest) {
        localStorage.removeItem("bakeryAuthToken");
        window.dispatchEvent(new Event("bakery-session-expired"));
    }
    return Promise.reject(error);
});

function App() {
    const [page, setPage] = useState("Dashboard");
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(
        () => Boolean(localStorage.getItem("bakeryAuthToken"))
    );
    const [cakes, setCakes] = useState([]);
    const [bills, setBills] = useState([]);

    const [cake, setCake] = useState({
        cakeName: "", category: "Birthday Cake",
        price: "", stock: ""
    });

    const [customer, setCustomer] = useState({
        name: "", phone: ""
    });

    const [selected, setSelected] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [editing, setEditing] = useState(null);

    const loadData = useCallback(async (role) => {
        try {
            const requests = [api.get("/cakes")];
            if (role === "admin") requests.push(api.get("/bills"));
            const [c, b] = await Promise.all(requests);
            setCakes(c.data);
            setBills(b?.data || []);
        } catch {
            alert("Unable to load bakery data. Please try again.");
        }
    }, []);

    const clearSession = () => {
        localStorage.removeItem("bakeryAuthToken");
        setUser(null);
        setCakes([]);
        setBills([]);
    };

    useEffect(() => {
        let active = true;
        const token = localStorage.getItem("bakeryAuthToken");
        if (!token) return undefined;

        api.get("/auth/me")
            .then(response => {
                if (active) {
                    setUser(response.data.user);
                    setPage(response.data.user.role === "admin" ? "Dashboard" : "Cakes");
                    loadData(response.data.user.role);
                }
            })
            .catch(() => {
                localStorage.removeItem("bakeryAuthToken");
            })
            .finally(() => {
                if (active) setAuthLoading(false);
            });

        return () => {
            active = false;
        };
    }, [loadData]);

    useEffect(() => {
        const expireSession = clearSession;
        window.addEventListener("bakery-session-expired", expireSession);
        return () => window.removeEventListener("bakery-session-expired", expireSession);
    }, []);

    const addCake = async (e) => {
        e.preventDefault();
        if (user?.role !== "admin") return;

        if (!cake.cakeName.trim() ||
            Number(cake.price) <= 0 ||
            cake.stock === "" || Number(cake.stock) < 0) {
            return alert("Enter valid cake details");
        }

        try {
            if (editing) {
                await api.put(`/cakes/${editing}`, cake);
                setEditing(null);
            } else {
                await api.post("/cakes", cake);
            }

            setCake({
                cakeName: "", category: "Birthday Cake",
                price: "", stock: ""
            });

            loadData(user.role);
            alert("Cake saved successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Unable to save cake");
        }
    };

    const editCake = (c) => {
        setCake({
            cakeName: c.cakeName,
            category: c.category,
            price: c.price,
            stock: c.stock
        });
        setEditing(c._id);
        setPage("Cakes");
    };

    const deleteCake = async (id) => {
        if (confirm("Do you want to delete this cake?")) {
            try {
                await api.delete(`/cakes/${id}`);
                loadData(user.role);
            } catch {
                alert("Delete failed");
            }
        }
    };

    const addItem = (c) => {
        setSelected(old => {
            const found = old.find(i => i.cakeId === c._id);

            if (found) {
                return old.map(i =>
                    i.cakeId === c._id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }

            return [...old, {
                cakeId: c._id,
                cakeName: c.cakeName,
                price: c.price,
                quantity: 1
            }];
        });
    };

    const subtotal = selected.reduce(
        (sum, i) => sum + i.price * i.quantity, 0
    );

    const total = Math.max(0, subtotal - Number(discount || 0));

    const createBill = async () => {
        if (!customer.name.trim() || selected.length === 0) {
            return alert("Enter customer name and select cakes");
        }

        if (Number(discount) < 0 || Number(discount) > subtotal) {
            return alert("Enter a valid discount");
        }

        try {
            const response = await api.post("/bills", {
                customerName: customer.name,
                phone: customer.phone,
                items: selected,
                discount: Number(discount)
            });

            setCustomer({ name: "", phone: "" });
            setSelected([]);
            setDiscount(0);

            await loadData(user.role);
            setPage("History");
            printBill(response.data);
        } catch (err) {
            alert(err.response?.data?.message || "Bill creation failed");
        }
    };

    const printBill = (bill) => {
        const content = `
        <html>
        <head>
            <title>Bakery Invoice</title>
            <style>
                body { font-family: Arial; padding: 30px; }
                h2 { text-align: center; color: #b38b35; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #999; padding: 10px; }
                .right { text-align: right; }
            </style>
        </head>
        <body>
            <h2>GOLDEN CAKE BAKERY</h2>
            <p>Customer: ${bill.customerName}</p>
            <p>Phone: ${bill.phone || "-"}</p>
            <p>Bill No: ${bill._id}</p>
            <p>Date: ${new Date(bill.billDate).toLocaleString()}</p>
            <hr>
            <table>
                <tr><th>Cake</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                ${bill.items.map(i => `
                    <tr>
                        <td>${i.cakeName}</td>
                        <td>${i.quantity}</td>
                        <td>₹${i.price}</td>
                        <td>₹${i.total}</td>
                    </tr>
                `).join("")}
            </table>
            <h3 class="right">Subtotal: ₹${bill.subtotal}</h3>
            <h3 class="right">Discount: ₹${bill.discount}</h3>
            <h2>Grand Total: ₹${bill.grandTotal}</h2>
            <center><p>Thank You! Visit Again.</p></center>
        </body>
        </html>`;

        const w = window.open("", "_blank");

        if (!w) {
            alert("Allow pop-ups to print the bill");
            return;
        }

        w.document.write(content);
        w.document.close();
        w.onload = () => w.print();
    };

    const revenue = bills.reduce(
        (sum, b) => sum + b.grandTotal, 0
    );

    if (authLoading) {
        return <div className="auth-loading" role="status">Loading your account…</div>;
    }
    if (!user) {
        return <AuthScreen onAuthenticated={({ token, user: signedInUser }) => {
            localStorage.setItem("bakeryAuthToken", token);
            setPage(signedInUser.role === "admin" ? "Dashboard" : "Cakes");
            setUser(signedInUser);
            loadData(signedInUser.role);
        }} />;
    }

    const isAdmin = user.role === "admin";
    const navigation = isAdmin
        ? ["Dashboard", "Cakes", "Billing", "History"]
        : ["Cakes"];

    return (
        <div className="app">

            <aside className="sidebar">
                <h2>🍰 GOLDEN</h2>
                <p className="sub">CAKE BAKERY</p>

                {navigation.map(p => (
                    <button
                        key={p}
                        className={page === p ? "active" : ""}
                        onClick={() => setPage(p)}
                    >
                        {!isAdmin && p === "Cakes" ? "Cake Catalog" : p}
                    </button>
                ))}

                <div className="sidebottom">
                    <strong>{user.name}</strong>
                    <span>{isAdmin ? "Administrator" : "Customer"}</span>
                    <button className="logout-button" onClick={clearSession}>
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="main">

                <header>
                    <h2>{!isAdmin && page === "Cakes" ? "Cake Catalog" : page}</h2>
                    <span>{isAdmin ? "ADMIN" : "CUSTOMER"}</span>
                </header>

                {isAdmin && page === "Dashboard" && (
                    <>
                        <h1>Welcome to Golden Cake Bakery</h1>
                        <p className="muted">
                            Manage your bakery sales and orders.
                        </p>

                        <div className="stats">
                            <div>
                                <h3>Total Cakes</h3>
                                <h1>{cakes.length}</h1>
                            </div>
                            <div>
                                <h3>Total Orders</h3>
                                <h1>{bills.length}</h1>
                            </div>
                            <div>
                                <h3>Total Revenue</h3>
                                <h1>₹{revenue}</h1>
                            </div>
                        </div>

                        <h2>Recent Orders</h2>
                        <BillTable bills={bills} printBill={printBill} />
                    </>
                )}

                {page === "Cakes" && (
                    <>
                        <h1>{isAdmin
                            ? (editing ? "Update Cake" : "Add New Cake")
                            : "Fresh from our bakery"}
                        </h1>

                        {isAdmin && <form className="form" onSubmit={addCake}>
                            <input
                                placeholder="Cake Name"
                                value={cake.cakeName}
                                onChange={e => setCake({
                                    ...cake, cakeName: e.target.value
                                })}
                            />

                            <select
                                value={cake.category}
                                onChange={e => setCake({
                                    ...cake, category: e.target.value
                                })}
                            >
                                <option>Birthday Cake</option>
                                <option>Wedding Cake</option>
                                <option>Chocolate Cake</option>
                                <option>Black Forest</option>
                                <option>Cheese Cake</option>
                                <option>Other</option>
                            </select>

                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Price"
                                value={cake.price}
                                onChange={e => setCake({
                                    ...cake, price: e.target.value
                                })}
                            />

                            <input
                                type="number"
                                min="0"
                                placeholder="Stock"
                                value={cake.stock}
                                onChange={e => setCake({
                                    ...cake, stock: e.target.value
                                })}
                            />

                            <button className="gold">
                                {editing ? "Update Cake" : "Add Cake"}
                            </button>

                            {editing && (
                                <button type="button" onClick={() => {
                                    setEditing(null);
                                    setCake({
                                        cakeName: "",
                                        category: "Birthday Cake",
                                        price: "",
                                        stock: ""
                                    });
                                }}>
                                    Cancel
                                </button>
                            )}
                        </form>}

                        {isAdmin && <h2>Available Cakes</h2>}

                        <div className="cakegrid">
                            {cakes.map(c => (
                                <div className="cakecard" key={c._id}>
                                    <h2>🎂</h2>
                                    <h3>{c.cakeName}</h3>
                                    <p>{c.category}</p>
                                    <h3>₹{c.price}</h3>
                                    <p>Stock: {c.stock}</p>
                                    {isAdmin && <>
                                        <button onClick={() => editCake(c)}>
                                            Edit
                                        </button>
                                        <button className="danger"
                                            onClick={() => deleteCake(c._id)}>
                                            Delete
                                        </button>
                                    </>}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {isAdmin && page === "Billing" && (
                    <>
                        <h1>Create Customer Bill</h1>

                        <div className="form">
                            <input
                                placeholder="Customer Name"
                                value={customer.name}
                                onChange={e => setCustomer({
                                    ...customer, name: e.target.value
                                })}
                            />

                            <input
                                placeholder="Phone Number"
                                value={customer.phone}
                                onChange={e => setCustomer({
                                    ...customer, phone: e.target.value
                                })}
                            />
                        </div>

                        <h2>Select Cakes</h2>

                        <div className="cakegrid">
                            {cakes.map(c => (
                                <div className="cakecard" key={c._id}>
                                    <h2>🎂</h2>
                                    <h3>{c.cakeName}</h3>
                                    <p>₹{c.price}</p>
                                    <p>Stock: {c.stock}</p>
                                    <button
                                        className="gold"
                                        disabled={c.stock < 1}
                                        onClick={() => addItem(c)}
                                    >
                                        Add to Bill
                                    </button>
                                </div>
                            ))}
                        </div>

                        <h2>Bill Details</h2>

                        <div className="tablewrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Cake</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Total</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selected.map(i => (
                                        <tr key={i.cakeId}>
                                            <td>{i.cakeName}</td>
                                            <td>₹{i.price}</td>
                                            <td>
                                                <input
                                                    className="qty"
                                                    type="number"
                                                    min="1"
                                                    value={i.quantity}
                                                    onChange={e => {
                                                        const q = Number(e.target.value);
                                                        if (q >= 1) {
                                                            setSelected(old =>
                                                                old.map(x =>
                                                                    x.cakeId === i.cakeId
                                                                        ? {...x, quantity: q}
                                                                        : x
                                                                )
                                                            );
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td>₹{i.price * i.quantity}</td>
                                            <td>
                                                <button
                                                    className="danger"
                                                    onClick={() => setSelected(
                                                        old => old.filter(
                                                            x => x.cakeId !== i.cakeId
                                                        )
                                                    )}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="totalbox">
                            <p>Subtotal: ₹{subtotal}</p>
                            <p>
                                Discount:
                                <input
                                    className="qty"
                                    type="number"
                                    min="0"
                                    max={subtotal}
                                    value={discount}
                                    onChange={e => setDiscount(e.target.value)}
                                />
                            </p>
                            <h2>Grand Total: ₹{total}</h2>
                            <button className="gold" onClick={createBill}>
                                Generate Bill & Print
                            </button>
                        </div>
                    </>
                )}

                {isAdmin && page === "History" && (
                    <>
                        <h1>Customer Order History</h1>
                        <BillTable bills={bills} printBill={printBill} />
                    </>
                )}

            </main>
        </div>
    );
}

function AuthScreen({ onAuthenticated }) {
    const [role, setRole] = useState("customer");
    const [isRegistering, setIsRegistering] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const endpoint = isRegistering ? "/auth/register" : "/auth/login";
            const response = await api.post(endpoint, form);
            if (response.data.user.role !== role) {
                setError(`This account is registered as ${response.data.user.role}. Choose that account type to sign in.`);
                return;
            }
            onAuthenticated(response.data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to connect. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const chooseRole = (nextRole) => {
        setRole(nextRole);
        setIsRegistering(false);
        setError("");
    };

    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="auth-title">
                <div className="auth-brand">
                    <span className="auth-icon" aria-hidden="true">✦</span>
                    <p className="auth-eyebrow">GOLDEN CAKE BAKERY</p>
                    <h1 id="auth-title">A little sweetness<br />starts here.</h1>
                    <p className="auth-intro">
                        Sign in to explore our freshly made cakes.
                    </p>
                </div>

                <div className="auth-form-wrap">
                    <div className="role-switch" aria-label="Choose account type">
                        <button
                            type="button"
                            className={role === "customer" ? "selected" : ""}
                            onClick={() => chooseRole("customer")}
                        >
                            Customer
                        </button>
                        <button
                            type="button"
                            className={role === "admin" ? "selected" : ""}
                            onClick={() => chooseRole("admin")}
                        >
                            Admin
                        </button>
                    </div>

                    <h2>{isRegistering ? "Create your account" : "Welcome back!"}</h2>
                    <p className="auth-subtitle">
                        {role === "admin"
                            ? "Sign in with your administrator account."
                            : isRegistering
                                ? "Join us to browse the cake collection."
                                : "Sign in to browse our cake collection."}
                    </p>

                    <form className="auth-form" onSubmit={submit}>
                        {isRegistering && (
                            <label>
                                Your name
                                <input
                                    autoComplete="name"
                                    maxLength="80"
                                    required
                                    value={form.name}
                                    onChange={event => setForm({ ...form, name: event.target.value })}
                                />
                            </label>
                        )}
                        <label>
                            Email address
                            <input
                                type="email"
                                autoComplete="email"
                                maxLength="254"
                                required
                                value={form.email}
                                onChange={event => setForm({ ...form, email: event.target.value })}
                            />
                        </label>
                        <label>
                            Password
                            <input
                                type="password"
                                autoComplete={isRegistering ? "new-password" : "current-password"}
                                minLength={isRegistering ? 12 : undefined}
                                maxLength={isRegistering ? 72 : undefined}
                                required
                                value={form.password}
                                onChange={event => setForm({ ...form, password: event.target.value })}
                            />
                            {isRegistering && <small>Use at least 12 characters.</small>}
                        </label>

                        {error && <p className="auth-error" role="alert">{error}</p>}

                        <button className="auth-submit" type="submit" disabled={submitting}>
                            {submitting
                                ? "Please wait…"
                                : isRegistering ? "Create customer account" : "Sign in"}
                        </button>
                    </form>

                    {role === "customer" && (
                        <p className="auth-toggle">
                            {isRegistering ? "Already have an account?" : "New to Golden Cake Bakery?"}
                            <button type="button" onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError("");
                            }}>
                                {isRegistering ? "Sign in" : "Create account"}
                            </button>
                        </p>
                    )}
                    {role === "admin" && (
                        <p className="auth-note">
                            Admin accounts are created by the system owner.
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}

function BillTable({ bills, printBill }) {
    return (
        <div className="tablewrap">
            <table>
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody>
                    {bills.map(b => (
                        <tr key={b._id}>
                            <td>{b.customerName}</td>
                            <td>{b.phone || "-"}</td>
                            <td>
                                {new Date(b.billDate).toLocaleDateString()}
                            </td>
                            <td>₹{b.grandTotal}</td>
                            <td>
                                <button onClick={() => printBill(b)}>
                                    Print
                                </button>
                            </td>
                        </tr>
                    ))}

                    {bills.length === 0 && (
                        <tr>
                            <td colSpan="5">No orders found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default App;