"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    static associate(models) {
      CartItem.belongsTo(models.Cart, { foreignKey: "cartId" });
      CartItem.belongsTo(models.Product, { foreignKey: "productId" });
    }
  }

  CartItem.init(
    {
      cartId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Carts",
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
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
      // Thêm trường notes từ migration
      notes: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      // Thêm trường selectedForCheckout từ migration
      selectedForCheckout: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "CartItem",
      // Thêm hooks để cập nhật totalPrice của Cart khi CartItem thay đổi
      hooks: {
        afterCreate: async (cartItem, options) => {
          await updateCartTotal(cartItem.cartId);
        },
        afterUpdate: async (cartItem, options) => {
          await updateCartTotal(cartItem.cartId);
        },
        afterDestroy: async (cartItem, options) => {
          await updateCartTotal(cartItem.cartId);
        },
      },
    }
  );

  // Helper function để cập nhật tổng giá trị Cart
  async function updateCartTotal(cartId) {
    const Cart = sequelize.models.Cart;
    const CartItem = sequelize.models.CartItem;
    const Product = sequelize.models.Product;

    const cart = await Cart.findByPk(cartId);
    if (!cart) return;

    const items = await CartItem.findAll({
      where: { cartId },
      include: [Product],
    });

    let totalPrice = 0;
    for (const item of items) {
      if (item.Product) {
        const price = item.Product.discountPrice || item.Product.price;
        totalPrice += price * item.quantity;
      }
    }

    await cart.update({ totalPrice });
  }

  return CartItem;
};
