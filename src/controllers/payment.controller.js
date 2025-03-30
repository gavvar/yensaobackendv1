import { Order } from "../models/index.js";
// Thêm vào payment.controller.js
export const getPaymentMethods = (req, res) => {
  const paymentMethods = [
    { id: "COD", name: "Thanh toán khi nhận hàng", icon: "cash.svg" },
    { id: "CARD", name: "Thẻ tín dụng/ghi nợ", icon: "card.svg" },
    { id: "BANK_TRANSFER", name: "Chuyển khoản ngân hàng", icon: "bank.svg" },
    { id: "MOMO", name: "Ví MoMo", icon: "momo.svg" },
    { id: "VNPAY", name: "VNPay", icon: "vnpay.svg" },
  ];

  return res.status(200).json({
    success: true,
    data: paymentMethods,
  });
};

/**
 * Tạo một giao dịch thanh toán mới
 */
export const createPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod, amount, returnUrl } = req.body;
    const userId = req.user.id;

    // Validate dữ liệu đầu vào
    if (!orderId || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin thanh toán cần thiết",
      });
    }

    // Kiểm tra đơn hàng tồn tại
    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy đơn hàng",
      });
    }

    // Xử lý theo từng phương thức thanh toán
    let paymentData;

    switch (paymentMethod) {
      case "VNPAY":
        // Code xử lý tạo URL thanh toán VNPAY
        paymentData = {
          paymentUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?xxxx", // URL thật sẽ được tạo bởi SDK VNPAY
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: amount,
          paymentMethod: paymentMethod,
        };
        break;

      case "MOMO":
        // Code xử lý tạo URL thanh toán MOMO
        paymentData = {
          paymentUrl:
            "https://test-payment.momo.vn/gw_payment/transactionProcessor?xxxx", // URL thật sẽ được tạo bởi SDK MOMO
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: amount,
          paymentMethod: paymentMethod,
        };
        break;

      case "BANK_TRANSFER":
        // Trả về thông tin tài khoản ngân hàng
        paymentData = {
          bankInfo: {
            bankName: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
            accountNumber: "1234567890",
            accountName: "CÔNG TY TNHH YẾN SÀO",
            branch: "Chi nhánh Thành phố Hồ Chí Minh",
            content: `Thanh toan don hang ${order.orderNumber}`,
          },
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: amount,
          paymentMethod: paymentMethod,
        };
        break;

      case "COD":
        // Thanh toán khi nhận hàng không cần xử lý online
        paymentData = {
          message: "Đơn hàng sẽ được thanh toán khi nhận hàng",
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: amount,
          paymentMethod: paymentMethod,
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Phương thức thanh toán không được hỗ trợ",
        });
    }

    // Lưu thông tin thanh toán vào cơ sở dữ liệu nếu cần
    // Code lưu payment transaction info

    return res.status(200).json({
      success: true,
      data: paymentData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xác thực kết quả thanh toán
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      paymentMethod,
      transactionId,
      orderId,
      amount,
      responseCode,
      signature,
    } = req.body;

    // Validate dữ liệu đầu vào
    if (!paymentMethod || !orderId) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin xác thực thanh toán",
      });
    }

    // Kiểm tra đơn hàng tồn tại
    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy đơn hàng",
      });
    }

    // Xử lý theo từng phương thức thanh toán
    let verificationResult;

    switch (paymentMethod) {
      case "VNPAY":
        // Code xác thực thanh toán VNPAY (kiểm tra chữ ký, mã response)
        verificationResult = {
          verified: responseCode === "00", // 00 là mã thành công của VNPAY
          message:
            responseCode === "00"
              ? "Thanh toán thành công"
              : "Thanh toán thất bại",
          transactionId,
        };
        break;

      case "MOMO":
        // Code xác thực thanh toán MOMO
        verificationResult = {
          verified: responseCode === "0", // 0 là mã thành công của MOMO
          message:
            responseCode === "0"
              ? "Thanh toán thành công"
              : "Thanh toán thất bại",
          transactionId,
        };
        break;

      case "BANK_TRANSFER":
        // Xác thực thủ công
        verificationResult = {
          verified: false,
          message: "Vui lòng đợi xác nhận từ admin",
          transactionId: null,
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Phương thức thanh toán không được hỗ trợ",
        });
    }

    // Cập nhật trạng thái thanh toán đơn hàng nếu xác thực thành công
    if (verificationResult.verified) {
      await order.update({
        paymentStatus: "paid",
        transactionId: verificationResult.transactionId,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...verificationResult,
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xử lý callback từ cổng thanh toán
 */
export const processPayment = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const callbackData = req.body;

    console.log(`Received callback from ${provider}:`, callbackData);

    let verificationResult;

    switch (provider.toLowerCase()) {
      case "vnpay":
        // Xử lý callback từ VNPAY
        // Kiểm tra chữ ký, responseCode, ...
        const vnp_ResponseCode = callbackData.vnp_ResponseCode;
        const vnp_TransactionStatus = callbackData.vnp_TransactionStatus;
        const vnp_TxnRef = callbackData.vnp_TxnRef; // Mã đơn hàng

        const isSuccessful =
          vnp_ResponseCode === "00" && vnp_TransactionStatus === "00";

        // Tìm đơn hàng theo mã
        const vnpayOrder = await Order.findOne({
          where: { orderNumber: vnp_TxnRef },
        });

        if (vnpayOrder) {
          // Cập nhật trạng thái thanh toán
          await vnpayOrder.update({
            paymentStatus: isSuccessful ? "paid" : "failed",
            transactionId: callbackData.vnp_TransactionNo || null,
          });
        }

        verificationResult = {
          success: true,
          verified: isSuccessful,
          message: isSuccessful
            ? "Thanh toán thành công"
            : "Thanh toán thất bại",
          orderNumber: vnp_TxnRef,
        };
        break;

      case "momo":
        // Xử lý callback từ MOMO
        const momoResultCode = callbackData.resultCode;
        const momoOrderId = callbackData.orderId;

        const momoSuccess = momoResultCode === "0";

        // Tìm đơn hàng theo mã
        const momoOrder = await Order.findOne({
          where: { orderNumber: momoOrderId },
        });

        if (momoOrder) {
          // Cập nhật trạng thái thanh toán
          await momoOrder.update({
            paymentStatus: momoSuccess ? "paid" : "failed",
            transactionId: callbackData.transId || null,
          });
        }

        verificationResult = {
          success: true,
          verified: momoSuccess,
          message: momoSuccess
            ? "Thanh toán thành công"
            : "Thanh toán thất bại",
          orderNumber: momoOrderId,
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Không hỗ trợ nhà cung cấp thanh toán: ${provider}`,
        });
    }

    // Phần này tùy thuộc vào yêu cầu của cổng thanh toán
    // Một số cổng thanh toán cần phản hồi với định dạng đặc biệt

    // Nếu không có yêu cầu đặc biệt, trả về kết quả JSON
    return res.status(200).json(verificationResult);
  } catch (error) {
    console.error(`Error processing ${req.params.provider} callback:`, error);

    // Luôn trả về 200 cho cổng thanh toán để tránh trường hợp họ gửi lại callback
    return res.status(200).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Xử lý thanh toán (quá trình xử lý)
 */
export const processPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Validate
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Thiếu mã đơn hàng",
      });
    }

    // Tìm đơn hàng
    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy đơn hàng",
      });
    }

    // Kiểm tra trạng thái thanh toán
    let status;
    let message;

    switch (order.paymentStatus) {
      case "paid":
        status = "success";
        message = "Thanh toán đã hoàn tất";
        break;
      case "pending":
        status = "pending";
        message = "Đơn hàng đang chờ thanh toán";
        break;
      case "failed":
        status = "failed";
        message = "Thanh toán thất bại";
        break;
      case "refunded":
        status = "refunded";
        message = "Đã hoàn tiền";
        break;
      default:
        status = "unknown";
        message = "Trạng thái thanh toán không xác định";
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        status,
        message,
        paymentMethod: order.paymentMethod,
        transactionId: order.transactionId || null,
        paidAt: order.paymentStatus === "paid" ? order.updatedAt : null,
      },
    });
  } catch (error) {
    next(error);
  }
};
