import { sequelize } from "../models/index.js";
import { Order, OrderItem, Product, User } from "../models/index.js";
import { Op } from "sequelize";

/**
 * Tính ngày bắt đầu dựa trên period
 */
export const calculateStartDate = (period) => {
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

  // Format ngày về đầu ngày
  startDate.setHours(0, 0, 0, 0);

  return startDate;
};

/**
 * Lấy thống kê tổng quan cho dashboard
 */
export const getDashboardStatistics = async (period = "month") => {
  const startDate = calculateStartDate(period);

  // Tính tổng doanh thu
  const revenue = await Order.sum("totalAmount", {
    where: {
      orderStatus: {
        [Op.in]: ["delivered", "shipped"],
      },
      orderDate: {
        [Op.gte]: startDate,
      },
    },
  });

  // Đếm số đơn hàng
  const totalOrders = await Order.count({
    where: {
      orderDate: {
        [Op.gte]: startDate,
      },
    },
  });

  // Đếm số đơn hàng theo trạng thái
  const ordersByStatus = await Order.findAll({
    attributes: [
      "orderStatus",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where: {
      orderDate: {
        [Op.gte]: startDate,
      },
    },
    group: ["orderStatus"],
    raw: true,
  });

  // Đếm số khách hàng mới
  const newCustomers = await User.count({
    where: {
      createdAt: {
        [Op.gte]: startDate,
      },
      role: "user",
    },
  });

  // Đếm số sản phẩm đã bán
  const productsSold = await OrderItem.sum("quantity", {
    include: {
      model: Order,
      as: "order",
      where: {
        orderStatus: {
          [Op.in]: ["delivered", "shipped"],
        },
        orderDate: {
          [Op.gte]: startDate,
        },
      },
      required: true,
    },
  });

  return {
    revenue: revenue || 0,
    totalOrders,
    ordersByStatus: ordersByStatus.reduce((acc, curr) => {
      acc[curr.orderStatus] = parseInt(curr.count);
      return acc;
    }, {}),
    newCustomers,
    productsSold: productsSold || 0,
    period,
  };
};

/**
 * Lấy thống kê doanh thu theo thời gian
 */
export const getRevenueStatistics = async (
  startDate,
  endDate,
  groupBy = "day"
) => {
  let start = startDate ? new Date(startDate) : new Date();
  let end = endDate ? new Date(endDate) : new Date();

  if (!startDate) {
    // Mặc định lấy 30 ngày gần nhất
    start.setDate(start.getDate() - 30);
  }

  // Format dates
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // SQL expression cho việc group by
  let dateGroup, dateSelect;

  switch (groupBy) {
    case "day":
      dateSelect = sequelize.fn("DATE", sequelize.col("orderDate"));
      dateGroup = [dateSelect];
      break;
    case "week":
      // MySQL specific syntax
      dateSelect = sequelize.literal(
        "CONCAT(YEAR(orderDate), '-', WEEK(orderDate, 1))"
      );
      dateGroup = [dateSelect];
      break;
    case "month":
      dateSelect = sequelize.literal("DATE_FORMAT(orderDate, '%Y-%m')");
      dateGroup = [dateSelect];
      break;
    default:
      dateSelect = sequelize.fn("DATE", sequelize.col("orderDate"));
      dateGroup = [dateSelect];
  }

  // Lấy doanh thu theo thời gian
  const revenueByTime = await Order.findAll({
    attributes: [
      [dateSelect, "date"],
      [sequelize.fn("SUM", sequelize.col("totalAmount")), "revenue"],
      [sequelize.fn("COUNT", sequelize.col("id")), "orderCount"],
    ],
    where: {
      orderStatus: {
        [Op.in]: ["delivered", "shipped", "processing"],
      },
      orderDate: {
        [Op.between]: [start, end],
      },
    },
    group: dateGroup,
    order: [[dateSelect, "ASC"]],
    raw: true,
  });

  return {
    revenueByTime: revenueByTime.map((item) => ({
      ...item,
      revenue: parseFloat(item.revenue),
      orderCount: parseInt(item.orderCount),
    })),
    startDate: start,
    endDate: end,
    groupBy,
  };
};

/**
 * Lấy thống kê sản phẩm bán chạy
 */
export const getTopProductsStatistics = async (
  limit = 10,
  period = "month"
) => {
  const startDate = calculateStartDate(period);

  // Lấy top sản phẩm bán chạy
  const topProducts = await OrderItem.findAll({
    attributes: [
      "productId",
      "productName",
      [sequelize.fn("SUM", sequelize.col("quantity")), "totalSold"],
      [sequelize.literal("SUM(price * quantity)"), "totalRevenue"],
    ],
    include: [
      {
        model: Order,
        as: "order",
        attributes: [],
        where: {
          orderStatus: {
            [Op.in]: ["delivered", "shipped", "processing"],
          },
          orderDate: {
            [Op.gte]: startDate,
          },
        },
        required: true,
      },
      {
        model: Product,
        as: "product",
        attributes: ["name", "slug", "thumbnail"],
        required: false,
      },
    ],
    group: ["productId", "productName"],
    order: [[sequelize.literal("totalSold"), "DESC"]],
    limit: parseInt(limit),
    raw: true,
    nest: true,
  });

  return {
    topProducts: topProducts.map((item) => ({
      ...item,
      totalSold: parseInt(item.totalSold),
      totalRevenue: parseFloat(item.totalRevenue),
    })),
    period,
  };
};

/**
 * Lấy thống kê phương thức thanh toán
 */
export const getPaymentMethodStatistics = async (period = "month") => {
  const startDate = calculateStartDate(period);

  // Thống kê theo phương thức thanh toán
  const paymentStats = await Order.findAll({
    attributes: [
      "paymentMethod",
      [sequelize.fn("COUNT", sequelize.col("id")), "orderCount"],
      [sequelize.fn("SUM", sequelize.col("totalAmount")), "totalAmount"],
    ],
    where: {
      orderDate: {
        [Op.gte]: startDate,
      },
      orderStatus: {
        [Op.notIn]: ["cancelled"],
      },
    },
    group: ["paymentMethod"],
    raw: true,
  });

  return {
    paymentStats: paymentStats.map((item) => ({
      ...item,
      orderCount: parseInt(item.orderCount),
      totalAmount: parseFloat(item.totalAmount),
    })),
    period,
  };
};

/**
 * Lấy thống kê trạng thái đơn hàng
 */
export const getOrderStatusStatistics = async () => {
  // Đếm số đơn hàng theo trạng thái
  const orderStatusStats = await Order.findAll({
    attributes: [
      "orderStatus",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    group: ["orderStatus"],
    raw: true,
  });

  // Thống kê trung bình thời gian xử lý đơn hàng
  const processingTimeStats = await sequelize.query(
    `
    SELECT 
      AVG(TIMESTAMPDIFF(HOUR, 
        (SELECT MIN(createdAt) FROM Orders WHERE id = o.id), 
        (SELECT MAX(updatedAt) FROM Orders WHERE id = o.id AND orderStatus = 'delivered')
      )) as avgProcessingHours
    FROM Orders o
    WHERE o.orderStatus = 'delivered'
  `,
    { type: sequelize.QueryTypes.SELECT }
  );

  return {
    orderStatusStats: orderStatusStats.reduce((acc, curr) => {
      acc[curr.orderStatus] = parseInt(curr.count);
      return acc;
    }, {}),
    avgProcessingHours: processingTimeStats[0].avgProcessingHours || 0,
  };
};

/**
 * Lấy dữ liệu báo cáo doanh thu
 */
export const getRevenueReportData = async (startDate, endDate) => {
  let start = startDate ? new Date(startDate) : new Date();
  let end = endDate ? new Date(endDate) : new Date();

  if (!startDate) {
    // Mặc định lấy 30 ngày gần nhất
    start.setDate(start.getDate() - 30);
  }

  // Format dates
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // Lấy dữ liệu đơn hàng
  const orders = await Order.findAll({
    where: {
      orderDate: {
        [Op.between]: [start, end],
      },
    },
    include: [
      {
        model: OrderItem,
        as: "items",
      },
    ],
    order: [["orderDate", "ASC"]],
  });

  return {
    reportPeriod: {
      start: start,
      end: end,
    },
    orders: orders,
    totalOrders: orders.length,
    totalRevenue: orders.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount || 0),
      0
    ),
  };
};
