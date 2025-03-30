"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("OrderNotes", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true, // Thay đổi từ false thành true
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      noteType: {
        type: Sequelize.ENUM(
          "general",
          "status_change",
          "payment_update",
          "customer_request",
          "internal"
        ),
        defaultValue: "general",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Thêm index để tăng tốc truy vấn
    await queryInterface.addIndex("OrderNotes", ["orderId"]);
    await queryInterface.addIndex("OrderNotes", ["userId"]);
    await queryInterface.addIndex("OrderNotes", ["noteType"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("OrderNotes");
  },
};
