"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderNote extends Model {
    static associate(models) {
      // định nghĩa các quan hệ
      OrderNote.belongsTo(models.Order, { foreignKey: "orderId", as: "order" });
      OrderNote.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }

  OrderNote.init(
    {
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Orders",
          key: "id",
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Thay đổi từ false thành true
        references: {
          model: "Users",
          key: "id",
        },
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Nội dung ghi chú không được để trống",
          },
        },
      },
      noteType: {
        type: DataTypes.ENUM(
          "general",
          "status_change",
          "payment_update",
          "customer_request",
          "internal"
        ),
        defaultValue: "general",
        validate: {
          isIn: {
            args: [
              [
                "general",
                "status_change",
                "payment_update",
                "customer_request",
                "internal",
              ],
            ],
            msg: "Loại ghi chú không hợp lệ",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "OrderNote",
      tableName: "OrderNotes",
    }
  );

  return OrderNote;
};
