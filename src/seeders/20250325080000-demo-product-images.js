"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("ProductImages", [
      // Ảnh cho Yến sào nguyên tổ loại A (ID: 7)
      {
        productId: 7, // Thay đổi từ 1 thành 7
        url: "/uploads/products/yenchung.jpg",
        isFeatured: true,
        altText: "Yến sào nguyên tổ loại A chính diện",
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productId: 7, // Thay đổi từ 1 thành 7
        url: "/uploads/products/yenchung.jpg",
        isFeatured: false,
        altText: "Yến sào nguyên tổ loại A đóng hộp",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Ảnh cho Yến sào nguyên tổ loại B (ID: 8)
      {
        productId: 8, // Thay đổi từ 2 thành 8
        url: "/uploads/products/yenchung.jpg",
        isFeatured: true,
        altText: "Yến sào nguyên tổ loại B chính diện",
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Ảnh cho Yến chưng đường phèn (ID: 9)
      {
        productId: 9, // Thay đổi từ 3 thành 9
        url: "/uploads/products/yenchung.jpg",
        isFeatured: true,
        altText: "Yến chưng đường phèn trong lọ",
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productId: 9, // Thay đổi từ 3 thành 9
        url: "/uploads/products/yentho.jpg",
        isFeatured: false,
        altText: "Yến chưng đường phèn đóng hộp quà tặng",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("ProductImages", null, {});
  },
};
