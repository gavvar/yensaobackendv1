"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra cấu trúc bảng hiện tại
    const tableInfo = await queryInterface.describeTable("Categories");

    const updates = [];

    // Thêm cột parentId nếu chưa có
    if (!tableInfo.parentId) {
      updates.push(
        queryInterface.addColumn("Categories", "parentId", {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Categories",
            key: "id",
          },
          onDelete: "SET NULL",
        })
      );
    }

    // Thêm cột imageUrl nếu chưa có
    if (!tableInfo.imageUrl) {
      updates.push(
        queryInterface.addColumn("Categories", "imageUrl", {
          type: Sequelize.STRING,
          allowNull: true,
        })
      );
    }

    // Thêm cột isActive nếu chưa có
    if (!tableInfo.isActive) {
      updates.push(
        queryInterface.addColumn("Categories", "isActive", {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        })
      );
    }

    // Thêm cột sortOrder nếu chưa có
    if (!tableInfo.sortOrder) {
      updates.push(
        queryInterface.addColumn("Categories", "sortOrder", {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        })
      );
    }

    // Thêm trường SEO metaTitle nếu chưa có
    if (!tableInfo.metaTitle) {
      updates.push(
        queryInterface.addColumn("Categories", "metaTitle", {
          type: Sequelize.STRING(255),
          allowNull: true,
        })
      );
    }

    // Thêm trường SEO metaDescription nếu chưa có
    if (!tableInfo.metaDescription) {
      updates.push(
        queryInterface.addColumn("Categories", "metaDescription", {
          type: Sequelize.TEXT,
          allowNull: true,
        })
      );
    }

    // Thêm index cho slug nếu cần
    updates.push(
      queryInterface
        .addIndex("Categories", ["slug"], {
          unique: true,
          name: "categories_slug_unique",
        })
        .catch((err) => {
          console.log("Index may already exist, skipping...");
        })
    );

    return Promise.all(updates);
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("Categories");
    const updates = [];

    // Xóa các cột đã thêm trong quá trình rollback
    if (tableInfo.parentId) {
      updates.push(queryInterface.removeColumn("Categories", "parentId"));
    }
    if (tableInfo.imageUrl) {
      updates.push(queryInterface.removeColumn("Categories", "imageUrl"));
    }
    if (tableInfo.isActive) {
      updates.push(queryInterface.removeColumn("Categories", "isActive"));
    }
    if (tableInfo.sortOrder) {
      updates.push(queryInterface.removeColumn("Categories", "sortOrder"));
    }
    if (tableInfo.metaTitle) {
      updates.push(queryInterface.removeColumn("Categories", "metaTitle"));
    }
    if (tableInfo.metaDescription) {
      updates.push(
        queryInterface.removeColumn("Categories", "metaDescription")
      );
    }

    // Xóa index nếu cần
    updates.push(
      queryInterface
        .removeIndex("Categories", "categories_slug_unique")
        .catch((err) => {
          console.log("Index may not exist, skipping removal...");
        })
    );

    return Promise.all(updates);
  },
};
