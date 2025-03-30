"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });

      Order.hasMany(models.OrderItem, {
        foreignKey: "orderId",
        as: "items",
      });

      Order.hasMany(models.OrderNote, {
        foreignKey: "orderId",
        as: "notes",
      });
    }
  }

  Order.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Tên khách hàng không được để trống" },
        },
      },
      customerEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: { msg: "Email không hợp lệ" },
        },
      },
      customerPhone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Số điện thoại không được để trống" },
        },
      },
      customerAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Địa chỉ không được để trống" },
        },
      },
      orderDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: [0], msg: "Tổng tiền không thể âm" },
        },
      },
      paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: {
            args: [["COD", "CARD", "BANK_TRANSFER", "MOMO", "VNPAY"]],
            msg: "Phương thức thanh toán không hợp lệ",
          },
        },
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
        defaultValue: "pending",
      },
      orderStatus: {
        type: DataTypes.ENUM(
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled"
        ),
        defaultValue: "pending",
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Các trường mới từ migration
      orderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      shippingFee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: "Phí vận chuyển không thể âm" },
        },
      },
      tax: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: "Thuế không thể âm" },
        },
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: "Giảm giá không thể âm" },
        },
      },
      couponCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: "VND",
        validate: {
          isIn: {
            args: [["VND", "USD", "EUR"]],
            msg: "Đơn vị tiền tệ không hợp lệ",
          },
        },
      },
      trackingNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shippingProvider: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Order",
      hooks: {
        beforeCreate: async (order) => {
          if (!order.orderNumber) {
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const random = Math.floor(Math.random() * 1000000)
              .toString()
              .padStart(6, "0");
            order.orderNumber = `ORD${year}${month}${day}${random}`;
          }
        },
      },
    }
  );

  Order.addScope("defaultScope", {
    where: {
      deleted: false,
    },
  });

  return Order;
};
