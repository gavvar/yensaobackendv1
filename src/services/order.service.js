import db from "../models/index.js";
const { Order, OrderItem, User } = db;

export const createOrder = async (userId, orderData) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    paymentMethod,
    orderItems,
    totalAmount,
  } = orderData;

  // Tạo bản ghi đơn hàng với trạng thái mặc định
  const newOrder = await Order.create({
    userId: userId,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    paymentMethod,
    totalAmount,
    orderDate: new Date(),
    orderStatus: "pending",
    paymentStatus: "pending",
  });

  // Nếu có danh sách orderItems, tạo bản ghi cho từng sản phẩm
  if (orderItems && Array.isArray(orderItems)) {
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: newOrder.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      });
    }
  }

  // Lấy lại đơn hàng kèm theo các chi tiết sản phẩm (order items)
  const orderWithItems = await Order.findByPk(newOrder.id, {
    include: [OrderItem],
  });

  return orderWithItems;
};

export const getOrderById = async (id) => {
  const order = await Order.findByPk(id, {
    include: [OrderItem],
  });
  if (!order) {
    throw new Error("Order not found");
  }
  return order;
};

export const getOrdersForUser = async (userId) => {
  const orders = await Order.findAll({
    where: { userId },
    include: [OrderItem],
  });
  return orders;
};

export const listOrders = async () => {
  // Dành cho Admin: lấy toàn bộ đơn hàng cùng với thông tin đơn hàng và người dùng (các trường cần thiết)
  const orders = await Order.findAll({
    include: [
      OrderItem,
      { model: User, attributes: ["id", "fullName", "email"] },
    ],
  });
  return orders;
};

export const updateOrderStatus = async (id, statusData) => {
  const order = await Order.findByPk(id);
  if (!order) {
    throw new Error("Order not found");
  }
  await order.update(statusData);
  return order;
};
