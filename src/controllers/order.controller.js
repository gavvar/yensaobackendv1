import {
  createOrder,
  getOrderById,
  getOrdersForUser,
  listOrders,
  updateOrderStatus,
} from "../services/order.service.js";

export const createNewOrder = async (req, res, next) => {
  try {
    // Sử dụng thông tin người dùng từ token nếu có
    const userId = req.user ? req.user.id : null;
    const orderData = req.body;
    if (userId) {
      orderData.userId = userId;
    }
    const newOrder = await createOrder(userId, orderData);
    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
};

export const getOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    // Lấy đơn hàng của người dùng dựa trên thông tin token
    const userId = req.user.id;
    const orders = await getOrdersForUser(userId);
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await listOrders();
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    // statusData có thể chứa các thay đổi như orderStatus, paymentStatus, v.v.
    const statusData = req.body;
    const updatedOrder = await updateOrderStatus(id, statusData);
    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
};
