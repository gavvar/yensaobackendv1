"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("Products", [
      {
        categoryId: 1,
        name: "Yến sào nguyên tổ loại A",
        slug: "yen-sao-nguyen-to-loai-a",
        description: "Yến sào nguyên tổ loại A, 100% tự nhiên",
        content:
          "Yến sào nguyên tổ loại A được thu hoạch từ các hang động tự nhiên, đảm bảo chất lượng cao nhất.",
        price: 2500000,
        discountPrice: 2300000,
        quantity: 50,
        unit: "hộp",
        status: "active",
        isFeatured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        categoryId: 1,
        name: "Yến sào nguyên tổ loại B",
        slug: "yen-sao-nguyen-to-loai-b",
        description: "Yến sào nguyên tổ loại B, 100% tự nhiên",
        content:
          "Yến sào nguyên tổ loại B được thu hoạch từ các hang động tự nhiên, chất lượng cao.",
        price: 2000000,
        discountPrice: 1800000,
        quantity: 30,
        unit: "hộp",
        status: "active",
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        categoryId: 2,
        name: "Yến chưng đường phèn",
        slug: "yen-chung-duong-phen",
        description: "Yến chưng sẵn với đường phèn, tiện lợi sử dụng",
        content:
          "Yến chưng đường phèn được chế biến từ yến sào nguyên chất, kết hợp với đường phèn tự nhiên.",
        price: 180000,
        discountPrice: 150000,
        quantity: 100,
        unit: "lọ",
        status: "active",
        isFeatured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Products", null, {});
  },
};
