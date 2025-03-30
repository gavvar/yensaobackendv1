"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("Categories", [
      {
        name: "Yến thô",
        slug: "yen-tho",
        description:
          "Yến thô nguyên tổ chưa qua chế biến, giữ nguyên dưỡng chất tự nhiên.",
        imageUrl: "/uploads/categories/yenchung.jpg",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metaTitle: "Yến thô - Sản phẩm chất lượng cao",
        metaDescription:
          "Yến thô tự nhiên 100%, giàu dinh dưỡng và có nhiều công dụng cho sức khỏe.",
      },
      {
        name: "Yến tinh chế",
        slug: "yen-tinh-che",
        description: "Yến sào tinh chế đã qua làm sạch, tiện lợi khi sử dụng.",
        imageUrl: "/uploads/categories/yenchung.jpg",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metaTitle: "Yến tinh chế - Sản phẩm chất lượng cao",
        metaDescription:
          "Yến sào tinh chế sạch, dễ sử dụng, giàu dinh dưỡng và tốt cho sức khỏe.",
      },
      {
        name: "Yến chưng sẵn",
        slug: "yen-chung-san",
        description:
          "Yến đã được chưng sẵn, tiện lợi khi sử dụng mà vẫn giữ nguyên dưỡng chất.",
        imageUrl: "/uploads/categories/yenchung.jpg",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metaTitle: "Yến chưng sẵn - Sản phẩm chất lượng cao",
        metaDescription:
          "Yến sào chưng sẵn tự nhiên 100%, bổ dưỡng và tiện lợi cho mọi lứa tuổi.",
      },
      {
        name: "Yến vụn",
        slug: "yen-vun",
        description:
          "Yến vụn từ tổ yến tự nhiên, giữ nguyên giá trị dinh dưỡng.",
        imageUrl: "/uploads/categories/yentho.jpg",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metaTitle: "Yến vụn - Sản phẩm giá tốt, dinh dưỡng cao",
        metaDescription:
          "Yến vụn tự nhiên 100%, giá thành hợp lý, thích hợp để chế biến nhiều món ăn bổ dưỡng.",
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Categories", null, {});
  },
};
