"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Orders", "deleted", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    // Thêm index cho trường deleted
    await queryInterface.addIndex("Orders", ["deleted"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Orders", "deleted");
  },
};
