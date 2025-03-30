import { Op } from "sequelize";
import db from "../models/index.js";
import { ValidationError } from "../utils/error.js";
import { incrementSaleCount } from "./product.service.js";
import { clearUserCart } from "./cart.service.js";
import {
  Order,
  OrderItem,
  Product,
  ProductImage,
  CartItem,
  OrderNote,
  User,
  sequelize,
} from "../models/index.js";

/**
 * Tạo đơn hàng mới
 */
export const createOrder = async (orderData, cartItems, userId = null) => {
  const transaction = await sequelize.transaction();

  try {
    // Tính tổng tiền từ cartItems
    let subtotal = 0;

    // Kiểm tra và lấy thông tin đầy đủ của sản phẩm
    const validatedProducts = [];

    for (const item of cartItems) {
      let product;

      // Kiểm tra xem product có phải là Sequelize model instance không
      if (userId && item.product && typeof item.product.get === "function") {
        // Đã là model instance, dùng luôn
        product = item.product;
      } else {
        // Query lại từ DB để lấy instance đầy đủ
        product = await Product.findByPk(item.product.id, {
          include: [{ model: ProductImage, as: "images" }],
        });

        if (!product) {
          throw new Error(`Không tìm thấy sản phẩm với ID ${item.product.id}`);
        }
      }

      // Kiểm tra số lượng trong kho
      if (product.quantity < item.quantity) {
        throw new Error(
          `Sản phẩm "${product.name}" chỉ còn ${product.quantity} trong kho`
        );
      }

      subtotal += product.price * item.quantity;

      // Lưu lại product đã validated để dùng sau
      validatedProducts.push({
        model: product,
        quantity: item.quantity,
        options: item.options || {},
        cartItemId: item.id, // Nếu có
      });
    }

    // Tạo mã đơn hàng
    const orderNumber = orderData.orderNumber || generateOrderNumber();

    // Tính tổng tiền đơn hàng
    const totalAmount =
      subtotal +
      (orderData.shippingFee || 0) -
      (orderData.discount || 0) +
      (orderData.tax || 0);

    // Tạo đơn hàng
    const order = await Order.create(
      {
        userId,
        orderNumber,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        orderDate: new Date(),
        totalAmount,
        subtotal,
        shippingFee: orderData.shippingFee || 0,
        tax: orderData.tax || 0,
        discount: orderData.discount || 0,
        couponCode: orderData.couponCode,
        currency: orderData.currency || "VND",
        paymentMethod: orderData.paymentMethod,
        paymentStatus: "pending",
        orderStatus: "pending",
        note: orderData.note,
      },
      { transaction }
    );

    // Tạo order items từ sản phẩm đã validated
    for (const validatedItem of validatedProducts) {
      const product = validatedItem.model;

      // Lấy ảnh sản phẩm an toàn
      let productImage = "";
      if (
        product.images &&
        product.images.length > 0 &&
        product.images[0].url
      ) {
        productImage = product.images[0].url;
      }

      await OrderItem.create(
        {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          quantity: validatedItem.quantity,
          price: product.price,
          originalPrice: product.originalPrice || product.price,
          productImage: productImage,
          productOptions: validatedItem.options,
        },
        { transaction }
      );

      // Cập nhật số lượng sản phẩm trong kho
      await product.update(
        {
          quantity: product.quantity - validatedItem.quantity,
        },
        { transaction }
      );
    }

    // Xóa sản phẩm đã mua khỏi giỏ hàng nếu có userId
    if (userId) {
      const selectedCartItemIds = validatedProducts
        .filter((item) => item.cartItemId) // Lọc các cartItem có id
        .map((item) => item.cartItemId);

      if (selectedCartItemIds.length > 0) {
        await CartItem.destroy({
          where: {
            id: { [Op.in]: selectedCartItemIds },
          },
          transaction,
        });
      }
    }

    await transaction.commit();
    return order;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Hàm tạo mã đơn hàng
const generateOrderNumber = () => {
  const prefix = "YS";
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${timestamp}${random}`;
};

/**
 * Lấy danh sách đơn hàng (có phân trang)
 */
export const getOrders = async (
  page = 1,
  limit = 10,
  filter = {},
  userId = null
) => {
  // Chuyển đổi page và limit thành số nguyên
  const pageInt = parseInt(page, 10) || 1; // Giá trị mặc định là 1 nếu parse thất bại
  const limitInt = parseInt(limit, 10) || 10; // Giá trị mặc định là 10 nếu parse thất bại

  const offset = (pageInt - 1) * limitInt;
  let where = {};

  // Nếu là người dùng thông thường, chỉ lấy đơn hàng của họ
  if (userId) {
    where.userId = userId;
  }

  // Lọc theo trạng thái đơn hàng
  if (filter.orderStatus) {
    where.orderStatus = filter.orderStatus;
  }

  // Lọc theo trạng thái thanh toán
  if (filter.paymentStatus) {
    where.paymentStatus = filter.paymentStatus;
  }

  // Lọc theo thời gian
  if (filter.startDate && filter.endDate) {
    where.orderDate = {
      [db.Sequelize.Op.between]: [filter.startDate, filter.endDate],
    };
  } else if (filter.startDate) {
    where.orderDate = {
      [db.Sequelize.Op.gte]: filter.startDate,
    };
  } else if (filter.endDate) {
    where.orderDate = {
      [db.Sequelize.Op.lte]: filter.endDate,
    };
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "slug"],
          },
        ],
      },
    ],
    order: [["orderDate", "DESC"]],
    limit: limitInt, // Sử dụng giá trị số nguyên đã được parse
    offset, // offset cũng được tính từ giá trị đã parse
  });

  return {
    orders: rows,
    pagination: {
      total: count,
      page: pageInt,
      limit: limitInt,
      totalPages: Math.ceil(count / limitInt),
    },
  };
};

/**
 * Lấy chi tiết đơn hàng
 */
export const getOrderById = async (orderId, userId = null) => {
  let where = { id: orderId };

  // Nếu là người dùng thông thường, chỉ cho phép xem đơn hàng của họ
  if (userId) {
    where.userId = userId;
  }

  const order = await Order.findOne({
    where,
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "slug"],
          },
        ],
      },
    ],
  });

  if (!order) {
    throw new ValidationError("Không tìm thấy đơn hàng", 404);
  }

  return order;
};

/**
 * Lấy đơn hàng theo orderNumber
 */
export const getOrderByOrderNumber = async (orderNumber, userId = null) => {
  let where = { orderNumber };

  // Nếu là người dùng thông thường, chỉ cho phép xem đơn hàng của họ
  if (userId) {
    where.userId = userId;
  }

  const order = await Order.findOne({
    where,
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "slug"],
          },
        ],
      },
    ],
  });

  if (!order) {
    throw new ValidationError("Không tìm thấy đơn hàng", 404);
  }

  return order;
};

/**
 * Cập nhật trạng thái đơn hàng
 */
export const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new ValidationError("Không tìm thấy đơn hàng", 404);
  }

  const updateData = { orderStatus: status };

  // Nếu chuyển sang trạng thái 'shipped', thêm ngày dự kiến giao hàng
  if (status === "shipped") {
    // Mặc định: 3 ngày sau khi giao cho đơn vị vận chuyển
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 3);
    updateData.estimatedDeliveryDate = estimatedDate;
  }

  await order.update(updateData);
  return order;
};

/**
 * Cập nhật trạng thái thanh toán
 */
export const updatePaymentStatus = async (orderId, status) => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new ValidationError("Không tìm thấy đơn hàng", 404);
  }

  // Cập nhật trạng thái thanh toán
  await order.update({ paymentStatus: status });

  // Nếu thanh toán thành công và đơn hàng đang ở trạng thái pending
  if (status === "paid" && order.orderStatus === "pending") {
    await order.update({ orderStatus: "processing" });
  }

  return order;
};

/**
 * Hủy đơn hàng
 */
export const cancelOrder = async (orderId, userId = null) => {
  const transaction = await sequelize.transaction();

  try {
    let where = { id: orderId };

    // Nếu là người dùng thông thường, chỉ cho phép hủy đơn hàng của họ
    if (userId) {
      where.userId = userId;
    }

    const order = await Order.findOne({
      where,
      include: [{ model: OrderItem, as: "items" }],
      transaction,
    });

    if (!order) {
      throw new ValidationError("Không tìm thấy đơn hàng", 404);
    }

    // Kiểm tra trạng thái đơn hàng
    if (["shipped", "delivered"].includes(order.orderStatus)) {
      throw new ValidationError(
        "Không thể hủy đơn hàng đã vận chuyển hoặc đã giao",
        400
      );
    }

    // Cập nhật trạng thái đơn hàng
    await order.update({ orderStatus: "cancelled" }, { transaction });

    // Hoàn lại số lượng sản phẩm
    for (const item of order.items) {
      await Product.increment(
        { quantity: item.quantity },
        { where: { id: item.productId }, transaction }
      );
    }

    await transaction.commit();
    return order;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Cập nhật thông tin đơn hàng
 */
export const updateOrderInfo = async (orderId, updateData, userId = null) => {
  let where = { id: orderId };

  // Nếu là người dùng thông thường, chỉ cho phép cập nhật đơn hàng của họ
  if (userId) {
    where.userId = userId;
  }

  const order = await Order.findOne({ where });

  if (!order) {
    throw new ValidationError("Không tìm thấy đơn hàng", 404);
  }

  // Chỉ cho phép cập nhật nếu đơn hàng chưa được giao
  if (["delivered", "cancelled"].includes(order.orderStatus)) {
    throw new ValidationError(
      "Không thể cập nhật đơn hàng đã giao hoặc đã hủy",
      400
    );
  }

  await order.update(updateData);
  return order;
};

/**
 * Admin: Cập nhật trạng thái đơn hàng với các thông tin bổ sung
 */
export const adminUpdateOrderStatus = async (orderId, updateData, userId) => {
  const {
    orderStatus,
    trackingNumber,
    shippingCarrier,
    estimatedDeliveryDate,
    notes,
  } = updateData;

  const transaction = await sequelize.transaction();

  try {
    // Tìm đơn hàng
    const order = await Order.findByPk(orderId, { transaction });

    if (!order) {
      throw new ValidationError("Không tìm thấy đơn hàng", 404);
    }

    // Xác thực trạng thái hợp lệ
    const allowedStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (orderStatus && !allowedStatuses.includes(orderStatus)) {
      throw new ValidationError("Trạng thái đơn hàng không hợp lệ");
    }

    // Kiểm tra tính hợp lệ của chuyển trạng thái
    if (
      orderStatus === "cancelled" &&
      ["delivered", "shipped"].includes(order.orderStatus)
    ) {
      throw new ValidationError(
        "Không thể hủy đơn hàng đã giao hoặc đang vận chuyển"
      );
    }

    // Tạo dữ liệu cập nhật
    const orderUpdateData = {};

    if (orderStatus) orderUpdateData.orderStatus = orderStatus;
    if (trackingNumber) orderUpdateData.trackingNumber = trackingNumber;
    if (shippingCarrier) orderUpdateData.shippingCarrier = shippingCarrier;

    // Tự động cập nhật ngày dự kiến giao hàng nếu trạng thái là 'shipped'
    if (orderStatus === "shipped") {
      if (estimatedDeliveryDate) {
        orderUpdateData.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
      } else {
        // Mặc định là 3 ngày sau khi đơn hàng được ship
        const defaultDeliveryDate = new Date();
        defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + 3);
        orderUpdateData.estimatedDeliveryDate = defaultDeliveryDate;
      }
    }

    // Cập nhật đơn hàng
    await order.update(orderUpdateData, { transaction });

    // Thêm ghi chú nếu có
    if (notes) {
      await OrderNote.create(
        {
          orderId,
          userId,
          note: notes,
          noteType: "status_change",
        },
        { transaction }
      );
    }

    // Lấy đơn hàng đã cập nhật cùng với thông tin liên quan
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: "items",
        },
        {
          model: OrderNote,
          as: "notes",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
      transaction,
    });

    await transaction.commit();
    return updatedOrder;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Admin: Cập nhật trạng thái thanh toán đơn hàng
 */
export const adminUpdatePaymentStatus = async (orderId, updateData, userId) => {
  const { paymentStatus, transactionId, notes } = updateData;

  const transaction = await sequelize.transaction();

  try {
    // Tìm đơn hàng
    const order = await Order.findByPk(orderId, { transaction });

    if (!order) {
      throw new ValidationError("Không tìm thấy đơn hàng", 404);
    }

    // Xác thực trạng thái thanh toán
    const allowedPaymentStatuses = ["pending", "paid", "failed", "refunded"];
    if (!allowedPaymentStatuses.includes(paymentStatus)) {
      throw new ValidationError("Trạng thái thanh toán không hợp lệ");
    }

    // Cập nhật đơn hàng
    await order.update(
      {
        paymentStatus,
        transactionId: transactionId || order.transactionId,
      },
      { transaction }
    );

    // Thêm ghi chú
    if (notes) {
      await OrderNote.create(
        {
          orderId,
          userId,
          note: notes,
          noteType: "payment_update",
        },
        { transaction }
      );
    }

    // Lấy đơn hàng đã cập nhật
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderNote,
          as: "notes",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
      transaction,
    });

    await transaction.commit();
    return updatedOrder;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Thêm ghi chú cho đơn hàng
 */
export const addOrderNoteService = async (orderId, noteData, userId) => {
  const { note, noteType = "general" } = noteData;

  // Kiểm tra đơn hàng tồn tại
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new ValidationError("Không tìm thấy đơn hàng", 404);
  }

  // Kiểm tra loại ghi chú hợp lệ
  const validNoteTypes = [
    "general",
    "status_change",
    "payment_update",
    "customer_request",
    "internal",
  ];
  if (!validNoteTypes.includes(noteType)) {
    throw new ValidationError("Loại ghi chú không hợp lệ");
  }

  // Tạo ghi chú mới
  const orderNote = await OrderNote.create({
    orderId,
    userId,
    note,
    noteType,
  });

  // Lấy ghi chú với thông tin người dùng
  return await OrderNote.findByPk(orderNote.id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
  });
};

/**
 * Xóa đơn hàng (soft delete)
 */
export const softDeleteOrder = async (orderId) => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new ValidationError("Không tìm thấy đơn hàng", 404);
  }

  // Kiểm tra điều kiện xóa
  if (order.orderStatus === "delivered" || order.orderStatus === "shipped") {
    throw new ValidationError("Không thể xóa đơn hàng đã giao hoặc đang giao");
  }

  // Thực hiện soft delete
  await order.update({ deleted: true });

  return { message: "Đã xóa đơn hàng thành công" };
};

/**
 * Khôi phục đơn hàng đã xóa
 */
export const restoreDeletedOrder = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    paranoid: false, // Để tìm cả record đã bị soft delete
  });

  if (!order) {
    throw new ValidationError("Không tìm thấy đơn hàng", 404);
  }

  if (!order.deleted) {
    throw new ValidationError("Đơn hàng chưa bị xóa");
  }

  // Khôi phục đơn hàng
  await order.update({ deleted: false });

  return { message: "Đã khôi phục đơn hàng thành công" };
};

/**
 * Lấy dữ liệu đơn hàng cho xuất Excel
 */
export const getOrdersForExport = async (filter = {}) => {
  // Xây dựng điều kiện lọc
  const whereCondition = buildOrderFilter(filter);

  // Lấy tất cả đơn hàng theo điều kiện lọc
  const orders = await Order.findAll({
    where: whereCondition,
    include: [
      {
        model: OrderItem,
        as: "items",
      },
    ],
    order: [["orderDate", "DESC"]],
  });

  // Chuyển về dạng JSON để xử lý dữ liệu
  return orders.map((order) => {
    const plainOrder = order.get({ plain: true });
    return {
      id: plainOrder.id,
      orderNumber: plainOrder.orderNumber,
      orderDate: plainOrder.orderDate,
      customerName: plainOrder.customerName,
      customerEmail: plainOrder.customerEmail,
      customerPhone: plainOrder.customerPhone,
      totalAmount: plainOrder.totalAmount,
      shippingFee: plainOrder.shippingFee,
      discount: plainOrder.discount,
      orderStatus: plainOrder.orderStatus,
      paymentStatus: plainOrder.paymentStatus,
      paymentMethod: plainOrder.paymentMethod,
      items: plainOrder.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
    };
  });
};

/**
 * Lấy tổng quan đơn hàng cho dashboard
 */
export const getOrderDashboardData = async (period = "month") => {
  // Tính ngày bắt đầu
  let startDate = new Date();
  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  // Set về đầu ngày
  startDate.setHours(0, 0, 0, 0);

  // Lấy số lượng đơn hàng theo trạng thái
  const orderCounts = await Order.findAll({
    attributes: [
      "orderStatus",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where: {
      orderDate: { [Op.gte]: startDate },
    },
    group: ["orderStatus"],
    raw: true,
  });

  // Lấy tổng doanh thu
  const totalRevenue = await Order.sum("totalAmount", {
    where: {
      orderDate: { [Op.gte]: startDate },
      orderStatus: { [Op.in]: ["delivered", "shipped"] },
    },
  });

  // Lấy số lượng đơn hàng theo ngày
  const dailyOrders = await Order.findAll({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("orderDate")), "date"],
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where: {
      orderDate: { [Op.gte]: startDate },
    },
    group: [sequelize.fn("DATE", sequelize.col("orderDate"))],
    order: [[sequelize.fn("DATE", sequelize.col("orderDate")), "ASC"]],
    raw: true,
  });

  // Lấy top 5 sản phẩm bán chạy
  const topProducts = await OrderItem.findAll({
    attributes: [
      "productId",
      "productName",
      [sequelize.fn("SUM", sequelize.col("quantity")), "totalSold"],
    ],
    include: [
      {
        model: Order,
        as: "order",
        attributes: [],
        where: {
          orderDate: { [Op.gte]: startDate },
        },
        required: true,
      },
    ],
    group: ["productId", "productName"],
    order: [[sequelize.literal("totalSold"), "DESC"]],
    limit: 5,
    raw: true,
  });

  // Đơn hàng mới nhất
  const recentOrders = await Order.findAll({
    limit: 10,
    order: [["orderDate", "DESC"]],
    attributes: [
      "id",
      "orderNumber",
      "orderDate",
      "customerName",
      "totalAmount",
      "orderStatus",
      "paymentStatus",
    ],
  });

  return {
    orderCounts: orderCounts.reduce((acc, item) => {
      acc[item.orderStatus] = parseInt(item.count);
      return acc;
    }, {}),
    totalRevenue: totalRevenue || 0,
    dailyOrders: dailyOrders.map((item) => ({
      date: item.date,
      count: parseInt(item.count),
    })),
    topProducts: topProducts.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      totalSold: parseInt(item.totalSold),
    })),
    recentOrders,
    period,
  };
};

// Hàm helper để xây dựng điều kiện lọc
function buildOrderFilter(filter) {
  const where = {};

  // Lọc theo khoảng thời gian
  if (filter.startDate && filter.endDate) {
    where.orderDate = {
      [Op.between]: [new Date(filter.startDate), new Date(filter.endDate)],
    };
  } else if (filter.startDate) {
    where.orderDate = {
      [Op.gte]: new Date(filter.startDate),
    };
  } else if (filter.endDate) {
    where.orderDate = {
      [Op.lte]: new Date(filter.endDate),
    };
  }

  // Lọc theo trạng thái đơn hàng
  if (filter.orderStatus) {
    where.orderStatus = filter.orderStatus;
  }

  // Lọc theo trạng thái thanh toán
  if (filter.paymentStatus) {
    where.paymentStatus = filter.paymentStatus;
  }

  // Lọc theo phương thức thanh toán
  if (filter.paymentMethod) {
    where.paymentMethod = filter.paymentMethod;
  }

  // Tìm kiếm theo từ khóa (tên, email, số điện thoại hoặc mã đơn hàng)
  if (filter.keyword) {
    where[Op.or] = [
      { customerName: { [Op.like]: `%${filter.keyword}%` } },
      { customerEmail: { [Op.like]: `%${filter.keyword}%` } },
      { customerPhone: { [Op.like]: `%${filter.keyword}%` } },
      { orderNumber: { [Op.like]: `%${filter.keyword}%` } },
    ];
  }

  return where;
}
