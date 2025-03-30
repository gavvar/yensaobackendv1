import { sequelize } from "../models/index.js";
import { Order, OrderItem, Product, User } from "../models/index.js";
import { Op } from "sequelize";
import {
  getDashboardStatistics,
  getRevenueStatistics,
  getTopProductsStatistics,
  getPaymentMethodStatistics,
  getOrderStatusStatistics,
  getRevenueReportData,
} from "../services/stats.service.js";

/**
 * Thống kê tổng quan cho dashboard
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const { period = "month" } = req.query;

    const dashboardStats = await getDashboardStatistics(period);

    return res.status(200).json({
      success: true,
      data: dashboardStats,
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    next(error);
  }
};

/**
 * Thống kê doanh thu theo thời gian
 */
export const getRevenueStats = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    const revenueStats = await getRevenueStatistics(
      startDate,
      endDate,
      groupBy
    );

    return res.status(200).json({
      success: true,
      data: revenueStats,
    });
  } catch (error) {
    console.error("Error in getRevenueStats:", error);
    next(error);
  }
};

/**
 * Thống kê sản phẩm bán chạy
 */
export const getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10, period = "month" } = req.query;

    const topProductsStats = await getTopProductsStatistics(limit, period);

    return res.status(200).json({
      success: true,
      data: topProductsStats,
    });
  } catch (error) {
    console.error("Error in getTopProducts:", error);
    next(error);
  }
};

/**
 * Thống kê theo phương thức thanh toán
 */
export const getPaymentMethodStats = async (req, res, next) => {
  try {
    const { period = "month" } = req.query;

    const paymentMethodStats = await getPaymentMethodStatistics(period);

    return res.status(200).json({
      success: true,
      data: paymentMethodStats,
    });
  } catch (error) {
    console.error("Error in getPaymentMethodStats:", error);
    next(error);
  }
};

/**
 * Thống kê theo trạng thái đơn hàng
 */
export const getOrderStatusStats = async (req, res, next) => {
  try {
    const orderStatusStats = await getOrderStatusStatistics();

    return res.status(200).json({
      success: true,
      data: orderStatusStats,
    });
  } catch (error) {
    console.error("Error in getOrderStatusStats:", error);
    next(error);
  }
};

/**
 * Xuất báo cáo doanh thu ra Excel
 */
export const exportRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const reportData = await getRevenueReportData(startDate, endDate);

    // Trả về dữ liệu JSON thay vì Excel (phát triển sau)
    return res.status(200).json({
      success: true,
      message: "Tính năng xuất báo cáo Excel sẽ được phát triển sau.",
      data: {
        reportPeriod: reportData.reportPeriod,
        totalOrders: reportData.totalOrders,
        totalRevenue: reportData.totalRevenue,
      },
    });
  } catch (error) {
    console.error("Error in exportRevenueReport:", error);
    next(error);
  }
};
