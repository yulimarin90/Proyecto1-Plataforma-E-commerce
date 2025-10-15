// app.ts
import express from "express";
import userRoutes from "./Users/routes/user.route";
import productRoutes from "./Products/routes/products.route"
import categoriesRoutes from "./Categories/routes/categories.route"
import SuppliersRoutes from "./Supplier/routes/supplier.routes"
import OrdersRoutes from "./Orders/routes/order.route"
import CheckoutRoutes from "./Checkout/routes/checkout.route"
import CarttRoutes from "./cart/routes/cart.route"
const app = express();

app.use(express.json());

// Rutas
app.use("/api", userRoutes);
app.use("/api", productRoutes);
app.use("/api", categoriesRoutes);
app.use("/api", SuppliersRoutes);
app.use("/api", OrdersRoutes);
app.use("/api", CheckoutRoutes);
app.use("/api", CarttRoutes);
// Endpoint raíz
app.get("/", (req, res) => {
  res.send("🚀 API funcionando");
});

export default app;
