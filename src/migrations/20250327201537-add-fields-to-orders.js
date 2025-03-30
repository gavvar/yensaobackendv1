"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thêm orderNumber (cho phép null trước)
    await queryInterface.addColumn("Orders", "orderNumber", {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true,
    });

    // Thêm các trường tài chính
    await queryInterface.addColumn("Orders", "shippingFee", {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
    });

    await queryInterface.addColumn("Orders", "tax", {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
    });

    await queryInterface.addColumn("Orders", "discount", {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
    });

    await queryInterface.addColumn("Orders", "couponCode", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // Thêm currency để hỗ trợ đa tiền tệ
    await queryInterface.addColumn("Orders", "currency", {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: "VND",
    });

    // Thêm thông tin vận chuyển
    await queryInterface.addColumn("Orders", "trackingNumber", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Orders", "shippingProvider", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Cập nhật ENUM paymentStatus cho MySQL
    await queryInterface.sequelize.query(`
      ALTER TABLE Orders MODIFY COLUMN paymentStatus 
      ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending'
    `);

    // Tạo indexes
    await queryInterface.addIndex("Orders", ["userId"]);
    await queryInterface.addIndex("Orders", ["orderNumber"]);

    // **Tối ưu cập nhật orderNumber**
    const orders = await queryInterface.sequelize.query(
      "SELECT id FROM Orders",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (orders.length > 0) {
      const date = new Date();
      const timestamp = date.getTime().toString().slice(-6);
      const dateStr = date.toISOString().slice(2, 10).replace(/-/g, "");

      const batchSize = 1000; // Chia nhỏ batch update nếu quá nhiều đơn hàng
      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        const cases = batch
          .map((order) => {
            const orderNumber = `ORD${dateStr}${timestamp}${order.id}`;
            return `WHEN id = ${order.id} THEN '${orderNumber}'`;
          })
          .join("\n    ");

        await queryInterface.sequelize.query(`
          UPDATE Orders
          SET orderNumber = CASE
            ${cases}
          END
          WHERE id IN (${batch.map((order) => order.id).join(", ")})
        `);
      }
    }

    // Sau khi cập nhật tất cả, đặt allowNull thành false
    await queryInterface.changeColumn("Orders", "orderNumber", {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Đầu tiên cập nhật các đơn hàng có status 'refunded' sang 'failed'
    await queryInterface.sequelize.query(`
      UPDATE Orders SET paymentStatus = 'failed' 
      WHERE paymentStatus = 'refunded'
    `);

    // Khôi phục ENUM ban đầu cho MySQL
    await queryInterface.sequelize.query(`
      ALTER TABLE Orders MODIFY COLUMN paymentStatus 
      ENUM('pending', 'paid', 'failed') DEFAULT 'pending'
    `);

    // Xóa các indexes
    await queryInterface.removeIndex("Orders", ["userId"]);
    await queryInterface.removeIndex("Orders", ["orderNumber"]);

    // Xóa các cột đã thêm
    await queryInterface.removeColumn("Orders", "orderNumber");
    await queryInterface.removeColumn("Orders", "shippingFee");
    await queryInterface.removeColumn("Orders", "tax");
    await queryInterface.removeColumn("Orders", "discount");
    await queryInterface.removeColumn("Orders", "couponCode");
    await queryInterface.removeColumn("Orders", "currency");
    await queryInterface.removeColumn("Orders", "trackingNumber");
    await queryInterface.removeColumn("Orders", "shippingProvider");
  },
};
