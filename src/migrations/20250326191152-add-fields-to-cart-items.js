"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ✅ Thêm trường notes để người dùng có thể thêm ghi chú
    await queryInterface.addColumn("CartItems", "notes", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // ✅ Thêm trường selectedForCheckout để chọn sản phẩm khi thanh toán
    await queryInterface.addColumn("CartItems", "selectedForCheckout", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });

    // ✅ Giữ updatedAt luôn cập nhật khi có thay đổi
    await queryInterface.changeColumn("CartItems", "updatedAt", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ),
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("CartItems", "notes");
    await queryInterface.removeColumn("CartItems", "selectedForCheckout");
    await queryInterface.changeColumn("CartItems", "updatedAt", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
  },
};
