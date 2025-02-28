"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("ProductImages", [
      {
        productId: 1,
        imageUrl: "/uploads/products/yen-sao-nguyen-to-loai-a-1.jpg",
        isThumbnail: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productId: 1,
        imageUrl: "/uploads/products/yen-sao-nguyen-to-loai-a-2.jpg",
        isThumbnail: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productId: 2,
        imageUrl: "/uploads/products/yen-sao-nguyen-to-loai-b-1.jpg",
        isThumbnail: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productId: 3,
        imageUrl: "/uploads/products/yen-chung-duong-phen-1.jpg",
        isThumbnail: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("ProductImages", null, {});
  },
};
