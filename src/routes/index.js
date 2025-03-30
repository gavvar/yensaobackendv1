import express from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import productRoute from "./product.route.js";
import categoryRoute from "./category.route.js";
import orderRoutes from "./order.route.js";
import cartRoute from "./cart.route.js";
import shippingRoute from "./shipping.route.js";
import paymentRoute from "./payment.route.js";
import statsRoute from "./stats.route.js"; // Thêm dòng này

const router = express.Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/products", productRoute);
router.use("/categories", categoryRoute);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoute);
router.use("/shipping", shippingRoute);
router.use("/payments", paymentRoute);
router.use("/stats", statsRoute); // Thêm dòng này

export default router;
