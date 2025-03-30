"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: "orderId",
        as: "order",
      });

      OrderItem.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }

  OrderItem.init(
    {
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Orders",
          key: "id",
        },
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Products",
          key: "id",
        },
      },
      productName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: { args: [1], msg: "Số lượng phải lớn hơn 0" },
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: [0], msg: "Giá không thể âm" },
        },
      },
      // Các trường mới từ migration
      originalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: "Giá gốc không thể âm" },
        },
        comment: "Giá gốc trước khi giảm giá",
      },
      productImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "URL ảnh sản phẩm",
      },
      productOptions: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Thông tin tùy chọn sản phẩm (như màu sắc, kích thước)",
      },
      discountValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: "Giảm giá không thể âm" },
        },
        comment: "Giá trị giảm giá áp dụng cho sản phẩm này",
      },
    },
    {
      sequelize,
      modelName: "OrderItem",
    }
  );

  return OrderItem;
};
