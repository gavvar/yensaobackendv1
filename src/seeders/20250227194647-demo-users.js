"use strict";
const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hàm để hash password
    const hashPassword = async (password) => {
      return bcrypt.hash(password, 10);
    };

    // Tạo mảng users
    const users = [
      {
        fullName: "Admin User",
        email: "admin@yensao.com",
        password: await hashPassword("Admin@123"),
        role: "admin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fullName: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        password: await hashPassword("Password123"),
        phone: "0901234567",
        address: "123 Đường Lê Lợi, Quận 1, TP. HCM",
        role: "customer",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fullName: "Trần Thị B",
        email: "tranthib@example.com",
        password: await hashPassword("Password123"),
        phone: "0912345678",
        address: "456 Đường Nguyễn Huệ, Quận 1, TP. HCM",
        role: "customer",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fullName: "duc ne",
        email: "duc@gmail.com",
        password: await hashPassword("duc123"),
        phone: "0923456789",
        address: "789 Đường Đồng Khởi, Quận 1, TP. HCM",
        role: "customer",
        isActive: false, // Tài khoản không hoạt động
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Bulk insert users
    await queryInterface.bulkInsert("Users", users, {});
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa tất cả dữ liệu trong bảng Users
    await queryInterface.bulkDelete("Users", null, {});
  },
};
