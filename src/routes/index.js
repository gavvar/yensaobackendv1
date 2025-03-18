import express from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import productRoute from "./product.route.js";
import categoryRoute from "./category.route.js";
import orderRoute from "./order.route.js";
import cartRoute from "./cart.route.js";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/products", productRoute);
router.use("/categories", categoryRoute);
router.use("/orders", orderRoute);
router.use("/cart", cartRoute);

export default router;
