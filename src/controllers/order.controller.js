import {
  createOrder,
  getOrders,
  getOrderById,
  getOrderByOrderNumber,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  updateOrderInfo,
  adminUpdateOrderStatus,
  adminUpdatePaymentStatus,
  addOrderNoteService,
  getOrdersForExport,
  softDeleteOrder,
  restoreDeletedOrder,
  getOrderDashboardData,
} from "../services/order.service.js";
import { getUserCart } from "../services/cart.service.js";
import { Order, OrderItem, OrderNote, User } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "sequelize";
import {
  NotFoundError,
  ValidationError,
  InvalidStatusError,
} from "../utils/error.js";

/**
 * Tạo đơn hàng mới
 */
export const createNewOrder = async (req, res, next) => {
  try {
    const orderData = req.body;
    const userId = req.user && req.user.id;

    // Kiểm tra người dùng đã đăng nhập chưa
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Bạn cần đăng nhập để tạo đơn hàng",
        },
      });
    }

    // Kiểm tra thông tin cơ bản của đơn hàng
    if (
      !orderData.customerName ||
      !orderData.customerPhone ||
      !orderData.customerAddress
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Thiếu thông tin người nhận hàng",
          details: {
            customerName: !orderData.customerName
              ? "Tên người nhận không được để trống"
              : null,
            customerPhone: !orderData.customerPhone
              ? "Số điện thoại không được để trống"
              : null,
            customerAddress: !orderData.customerAddress
              ? "Địa chỉ giao hàng không được để trống"
              : null,
          },
        },
      });
    }

    let cartItems = [];

    // Nếu có items trong request, sử dụng items đó
    if (orderData.items && orderData.items.length > 0) {
      cartItems = orderData.items;

      // Kiểm tra tính hợp lệ của items
      for (const item of cartItems) {
        if (!item.product || !item.product.id || !item.quantity) {
          return res.status(400).json({
            success: false,
            error: {
              message: "Dữ liệu sản phẩm không hợp lệ",
              details: "Mỗi sản phẩm phải có product.id và quantity",
            },
          });
        }
      }
    } else {
      // Nếu không có items, lấy từ giỏ hàng
      const cart = await getUserCart(userId);

      if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Giỏ hàng trống",
          },
        });
      }

      cartItems = cart.items.filter((item) => item.selectedForCheckout);

      if (cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Không có sản phẩm nào được chọn để thanh toán",
          },
        });
      }
    }

    // Ghi log để debug
    console.log("Creating order with data:", {
      orderData,
      cartItemsCount: cartItems.length,
    });

    // Tạo đơn hàng
    const order = await createOrder(orderData, cartItems, userId);

    return res.status(201).json({
      success: true,
      data: order,
      message: "Đã tạo đơn hàng thành công",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    next(error);
  }
};

/**
 * Lấy danh sách đơn hàng
 */
export const getOrderList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const safeLimit = Math.min(limit, 100);

    let filter = {};
    // Xử lý an toàn khi parse filter
    if (req.query.filter) {
      try {
        filter = JSON.parse(req.query.filter);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Filter format không hợp lệ",
            details: parseError.message,
          },
        });
      }
    }

    const userId = req.user.role !== "admin" ? req.user.id : null;
    const result = await getOrders(page, safeLimit, filter, userId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting order list:", error);
    next(error);
  }
};

/**
 * Lấy chi tiết đơn hàng theo ID
 */
export const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Nếu không phải admin, chỉ lấy đơn hàng của người dùng hiện tại
    const userId = req.user.role !== "admin" ? req.user.id : null;

    const order = await getOrderById(id, userId);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy đơn hàng theo orderNumber
 */
export const getOrderByNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;

    // Nếu không phải admin, chỉ lấy đơn hàng của người dùng hiện tại
    const userId = req.user.role !== "admin" ? req.user.id : null;

    const order = await getOrderByOrderNumber(orderNumber, userId);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin cập nhật trạng thái đơn hàng
 */
export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const updatedOrder = await adminUpdateOrderStatus(id, updateData, userId);

    return res.status(200).json({
      success: true,
      data: updatedOrder,
      message: `Đã cập nhật đơn hàng sang trạng thái ${
        updateData.orderStatus || "mới"
      }`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin cập nhật trạng thái thanh toán đơn hàng
 */
export const updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const updatedOrder = await adminUpdatePaymentStatus(id, updateData, userId);

    return res.status(200).json({
      success: true,
      data: updatedOrder,
      message: `Đã cập nhật trạng thái thanh toán sang ${updateData.paymentStatus}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Hủy đơn hàng
 */
export const cancelUserOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Nếu không phải admin, chỉ cho phép hủy đơn hàng của người dùng hiện tại
    const userId = req.user.role !== "admin" ? req.user.id : null;

    const order = await cancelOrder(id, userId);

    return res.status(200).json({
      success: true,
      data: order,
      message: "Đã hủy đơn hàng thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật thông tin đơn hàng
 */
export const updateOrderInfoController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.role !== "admin" ? req.user.id : null;

    // Chỉ cho phép cập nhật một số trường cụ thể
    const allowedFields = [
      "customerName",
      "customerPhone",
      "customerAddress",
      "note",
    ];
    const filteredData = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    const order = await updateOrderInfo(id, filteredData, userId);

    return res.status(200).json({
      success: true,
      data: order,
      message: "Đã cập nhật thông tin đơn hàng",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy trạng thái đơn hàng và thanh toán
 */
export const getOrderStatuses = (req, res) => {
  const orderStatuses = [
    { value: "pending", label: "Chờ xác nhận", color: "gray" },
    { value: "processing", label: "Đang xử lý", color: "blue" },
    { value: "shipped", label: "Đang giao hàng", color: "orange" },
    { value: "delivered", label: "Đã giao hàng", color: "green" },
    { value: "cancelled", label: "Đã hủy", color: "red" },
  ];

  const paymentStatuses = [
    { value: "pending", label: "Chờ thanh toán", color: "orange" },
    { value: "paid", label: "Đã thanh toán", color: "green" },
    { value: "failed", label: "Thanh toán thất bại", color: "red" },
    { value: "refunded", label: "Đã hoàn tiền", color: "blue" },
  ];

  return res.status(200).json({
    success: true,
    data: {
      orderStatuses,
      paymentStatuses,
    },
  });
};

/**
 * Thêm ghi chú cho đơn hàng
 */
export const addOrderNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const noteData = req.body;
    const userId = req.user && req.user.id ? req.user.id : null;

    const newNote = await addOrderNoteService(id, noteData, userId);

    return res.status(201).json({
      success: true,
      data: newNote,
      message: "Đã thêm ghi chú cho đơn hàng",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xuất danh sách đơn hàng ra Excel
 */
export const exportOrdersToExcel = async (req, res, next) => {
  try {
    // Lấy tham số lọc từ query string
    let filter = {};
    if (req.query.filter) {
      try {
        filter = JSON.parse(req.query.filter);
      } catch (error) {
        throw new ValidationError("Filter format không hợp lệ");
      }
    }

    const jsonOrders = await getOrdersForExport(filter);

    // Thay vì xuất Excel thật, chúng ta sẽ gửi về dữ liệu JSON trước
    return res.status(200).json({
      success: true,
      message: "Dữ liệu để xuất Excel",
      data: {
        orders: jsonOrders,
        totalOrders: jsonOrders.length,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa đơn hàng (soft delete)
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await softDeleteOrder(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Khôi phục đơn hàng đã xóa
 */
export const restoreOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await restoreDeletedOrder(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy tổng quan đơn hàng cho dashboard
 */
export const getOrderDashboard = async (req, res, next) => {
  try {
    const { period = "month" } = req.query;

    const dashboardData = await getOrderDashboardData(period);

    return res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
};
