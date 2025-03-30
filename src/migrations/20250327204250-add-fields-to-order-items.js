"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Đặt default cho quantity
    await queryInterface.changeColumn("OrderItems", "quantity", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });

    // Thêm indexes
    await queryInterface.addIndex("OrderItems", ["orderId"]);
    await queryInterface.addIndex("OrderItems", ["productId"]);

    // Thêm thông tin bổ sung với các cải tiến
    await queryInterface.addColumn("OrderItems", "originalPrice", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Giá gốc trước khi giảm giá",
    });

    // Thêm cột productImage với giới hạn độ dài
    await queryInterface.addColumn("OrderItems", "productImage", {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: "URL ảnh sản phẩm",
    });

    // Thêm cột cho options, variant với comment mẫu
    await queryInterface.addColumn("OrderItems", "productOptions", {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "Thông tin tùy chọn sản phẩm (như màu sắc, kích thước)",
    });

    // Thêm cột discountValue để lưu giá trị giảm giá từng sản phẩm
    await queryInterface.addColumn("OrderItems", "discountValue", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Giá trị giảm giá áp dụng cho sản phẩm này",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa indexes
    await queryInterface.removeIndex("OrderItems", ["orderId"]);
    await queryInterface.removeIndex("OrderItems", ["productId"]);

    // Khôi phục quantity
    await queryInterface.changeColumn("OrderItems", "quantity", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Xóa các cột đã thêm
    await queryInterface.removeColumn("OrderItems", "originalPrice");
    await queryInterface.removeColumn("OrderItems", "productImage");
    await queryInterface.removeColumn("OrderItems", "productOptions");
    await queryInterface.removeColumn("OrderItems", "discountValue");
  },
};
