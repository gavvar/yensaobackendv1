"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("Categories", [
      {
        name: "Yến sào nguyên tổ",
        slug: "yen-sao-nguyen-to",
        description: "Yến sào nguyên tổ tự nhiên, không qua chế biến",
        imageUrl: "/uploads/categories/yen-sao-nguyen-to.jpg",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Yến chưng sẵn",
        slug: "yen-chung-san",
        description: "Yến đã được chưng sẵn, tiện lợi khi sử dụng",
        imageUrl: "/uploads/categories/yen-chung-san.jpg",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Yến thô",
        slug: "yen-tho",
        description: "Yến thô chưa qua chế biến",
        imageUrl: "/uploads/categories/yen-tho.jpg",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Categories", null, {});
  },
};
