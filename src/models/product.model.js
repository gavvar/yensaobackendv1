"use strict";
const { Model } = require("sequelize"); // Thêm dòng này để import Model

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, {
        foreignKey: "categoryId",
        as: "category", // Cần alias này
      });

      Product.hasMany(models.ProductImage, {
        foreignKey: "productId",
        as: "images", // Cần alias này
      });
      // Product.hasMany(models.CartItem, { foreignKey: "productId" });
      // Product.hasMany(models.OrderItem, { foreignKey: "productId" });
    }
  }

  Product.init(
    {
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Categories",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      discountPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          isInt: true,
          min: 0,
        },
      },
      unit: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // Thêm các trường mới
      metaTitle: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      metaDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          isInt: true,
          min: 0,
        },
      },
      saleCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          isInt: true,
          min: 0,
        },
      },
      sku: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      weight: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      origin: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Product",
    }
  );

  return Product;
};
