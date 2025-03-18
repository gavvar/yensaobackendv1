"use strict";
const { Model } = require("sequelize");
const slugify = require("slugify");

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      // Liên kết với sản phẩm
      Category.hasMany(models.Product, {
        foreignKey: "categoryId",
        as: "products",
      });

      // Self-reference cho cấu trúc category phân cấp
      Category.belongsTo(Category, {
        as: "parent",
        foreignKey: "parentId",
      });
      Category.hasMany(Category, {
        as: "children",
        foreignKey: "parentId",
      });
    }
  }

  Category.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Categories",
          key: "id",
        },
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Category",
      tableName: "Categories",
      hooks: {
        // Tự động tạo slug từ name
        beforeValidate: (category) => {
          if (category.name) {
            category.slug = slugify(category.name, {
              lower: true,
              strict: true,
            });
          }
        },
      },
    }
  );

  return Category;
};
