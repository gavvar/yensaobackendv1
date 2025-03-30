// Thêm vào file migration vừa được tạo
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Chỉ tạo bảng ProductImages
    await queryInterface.createTable("ProductImages", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Products",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      altText: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Thêm index cho productId
    await queryInterface.addIndex("ProductImages", ["productId"]);
  },

  down: async (queryInterface, Sequelize) => {
    // Chỉ xóa bảng ProductImages
    await queryInterface.dropTable("ProductImages");
  },
};
