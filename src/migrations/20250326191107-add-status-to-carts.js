"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ✅ Thêm cột `status` nếu chưa có
    await queryInterface.addColumn("Carts", "status", {
      type: Sequelize.ENUM("active", "completed", "abandoned"),
      defaultValue: "active",
      after: "userId",
    });

    // ✅ Giữ `updatedAt` luôn cập nhật tự động
    await queryInterface.changeColumn("Carts", "updatedAt", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ),
    });

    // ✅ Thêm index để tăng tốc truy vấn
    await queryInterface.addIndex("Carts", ["userId", "status"]);

    // ✅ Tránh lỗi trùng giỏ hàng (chỉ 1 giỏ hàng active cho mỗi user)
    await queryInterface.addConstraint("Carts", {
      fields: ["userId", "status"],
      type: "unique",
      name: "unique_active_cart_per_user",
      where: { status: "active" },
    });

    // ✅ Thêm cột `totalPrice` để tính tổng tiền giỏ hàng
    await queryInterface.addColumn("Carts", "totalPrice", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Carts", "totalPrice");
    await queryInterface.removeConstraint(
      "Carts",
      "unique_active_cart_per_user"
    );
    await queryInterface.removeIndex("Carts", ["userId", "status"]);
    await queryInterface.changeColumn("Carts", "updatedAt", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.removeColumn("Carts", "status");
  },
};
