"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Kiểm tra xem bảng có tồn tại không
    try {
      await queryInterface.describeTable("Products");
    } catch (error) {
      console.error("Products table does not exist, skipping migration");
      return;
    }

    // Danh sách cột cần thêm
    const columns = [
      // SEO fields
      {
        name: "metaTitle",
        definition: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
      },
      {
        name: "metaDescription",
        definition: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
      },
      // Analytics fields
      {
        name: "viewCount",
        definition: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
      },
      {
        name: "saleCount",
        definition: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
      },
      // Additional useful fields
      {
        name: "sku",
        definition: {
          type: Sequelize.STRING(50),
          allowNull: true,
          unique: true,
        },
      },
      {
        name: "weight",
        definition: {
          type: Sequelize.DECIMAL(8, 2),
          allowNull: true,
          comment: "Trọng lượng (gram)",
        },
      },
      // Trường dimensions đã bị xóa ở đây
      {
        name: "origin",
        definition: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: "Xuất xứ sản phẩm",
        },
      },
    ];

    // Thêm từng cột một
    const operations = columns.map((column) => {
      return queryInterface
        .addColumn("Products", column.name, column.definition)
        .catch((error) => {
          console.log(`Column ${column.name} might already exist, skipping...`);
        });
    });

    return Promise.all(operations);
  },

  down: async (queryInterface, Sequelize) => {
    const columns = [
      "metaTitle",
      "metaDescription",
      "viewCount",
      "saleCount",
      "sku",
      "weight",
      // "dimensions", // Đã xóa
      "origin",
    ];

    const operations = columns.map((column) => {
      return queryInterface.removeColumn("Products", column).catch((error) => {
        console.log(`Error removing column ${column}, it might not exist.`);
      });
    });

    return Promise.all(operations);
  },
};
