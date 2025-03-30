"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Kiểm tra xem bảng có tồn tại không
    try {
      const tableInfo = await queryInterface.describeTable("Categories");

      // Thêm metaTitle nếu chưa có
      if (!tableInfo.metaTitle) {
        await queryInterface.addColumn("Categories", "metaTitle", {
          type: Sequelize.STRING(255),
          allowNull: true,
        });
      }

      // Thêm metaDescription nếu chưa có
      if (!tableInfo.metaDescription) {
        await queryInterface.addColumn("Categories", "metaDescription", {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
    } catch (error) {
      console.error("Error checking/adding columns:", error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn("Categories", "metaTitle");
      await queryInterface.removeColumn("Categories", "metaDescription");
    } catch (error) {
      console.error("Error removing columns:", error);
    }
  },
};
