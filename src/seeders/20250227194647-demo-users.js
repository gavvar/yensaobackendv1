"use strict";
const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    return queryInterface.bulkInsert("Users", [
      {
        fullName: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        phone: "0987654321",
        address: "Hà Nội, Việt Nam",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fullName: "Customer User",
        email: "customer@example.com",
        password: hashedPassword,
        phone: "0123456789",
        address: "Hồ Chí Minh, Việt Nam",
        role: "customer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Users", null, {});
  },
};
