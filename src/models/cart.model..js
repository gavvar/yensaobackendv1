"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    static associate(models) {
      Cart.belongsTo(models.User, { foreignKey: "userId" });
      Cart.hasMany(models.CartItem, { foreignKey: "cartId" });
    }
  }

  Cart.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      // Thêm trường status từ migration
      status: {
        type: DataTypes.ENUM("active", "completed", "abandoned"),
        defaultValue: "active",
      },
      // Thêm trường totalPrice từ migration
      totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Cart",
      // Thêm hooks để tự động cập nhật totalPrice
      hooks: {
        afterFind: async (result) => {
          // Nếu là mảng các cart
          if (Array.isArray(result)) {
            for (const cart of result) {
              if (cart.CartItems && cart.CartItems.length) {
                await updateCartTotal(cart);
              }
            }
          }
          // Nếu là một cart duy nhất
          else if (result && result.CartItems) {
            await updateCartTotal(result);
          }
        },
      },
    }
  );

  // Helper function để cập nhật tổng giá trị
  async function updateCartTotal(cart) {
    if (cart.CartItems && cart.CartItems.length > 0) {
      let total = 0;
      for (const item of cart.CartItems) {
        if (item.Product) {
          const price = item.Product.discountPrice || item.Product.price;
          total += price * item.quantity;
        }
      }
      cart.totalPrice = total;
    }
  }

  return Cart;
};
