import { Op } from "sequelize";
import db from "../models/index.js";
import slugify from "slugify";
import { ValidationError } from "../utils/errors.js";

const { Product, ProductImage, Category } = db;

/**
 * Danh sách sản phẩm với phân trang, tìm kiếm, lọc và sắp xếp
 */
export const listProducts = async ({
  page = 1,
  limit = 10,
  sort,
  filter,
  search,
}) => {
  const offset = (page - 1) * limit;
  const options = {
    where: {},
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: ProductImage,
        as: "images",
        attributes: ["id", "url", "isFeatured"],
        required: false,
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
        required: false,
      },
    ],
  };

  // Xử lý tìm kiếm
  if (search) {
    options.where.name = { [Op.like]: `%${search}%` };
  }

  // Xử lý filter
  if (filter) {
    try {
      const filters = typeof filter === "string" ? JSON.parse(filter) : filter;

      // Filter theo danh mục
      if (filters.categoryId) {
        options.where.categoryId = filters.categoryId;
      }

      // Filter theo khoảng giá
      if (filters.price) {
        if (filters.price.min) {
          options.where.price = {
            ...options.where.price,
            [Op.gte]: filters.price.min,
          };
        }
        if (filters.price.max) {
          options.where.price = {
            ...options.where.price,
            [Op.lte]: filters.price.max,
          };
        }
      }
    } catch (error) {
      console.log("Filter parsing error", error);
    }
  }

  // Xử lý sắp xếp
  if (sort) {
    try {
      const [field, direction] = sort.split(",");
      const validFields = ["name", "price", "createdAt"];
      const validDirections = ["ASC", "DESC"];

      if (validFields.includes(field) && validDirections.includes(direction)) {
        options.order = [[field, direction]];
      }
    } catch (error) {
      console.log("Sort parsing error", error);
    }
  }

  const { count, rows } = await Product.findAndCountAll(options);

  return {
    products: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};

/**
 * Lấy chi tiết sản phẩm theo slug
 */
export const fetchProductBySlug = async (slug) => {
  const product = await Product.findOne({
    where: { slug },
    include: [
      {
        model: ProductImage,
        as: "images",
        attributes: ["id", "url", "isFeatured"],
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
    ],
  });

  if (!product) throw new ValidationError("Không tìm thấy sản phẩm", 404);
  return product;
};

/**
 * Lấy chi tiết sản phẩm theo ID
 */
export const fetchProductById = async (id) => {
  const product = await Product.findByPk(id, {
    include: [
      {
        model: ProductImage,
        as: "images",
        attributes: ["id", "url", "isFeatured", "altText", "sortOrder"],
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
    ],
  });

  if (!product) throw new ValidationError("Không tìm thấy sản phẩm", 404);
  return product;
};

/**
 * Thêm mới sản phẩm và ảnh (nếu có)
 */
export const addProduct = async (productData) => {
  console.log(
    "SERVICE - Adding product with data:",
    JSON.stringify(productData)
  );

  // Đảm bảo slug được tạo
  if (!productData.slug && productData.name) {
    productData.slug = slugify(productData.name, { lower: true });
  }

  // Tạo sản phẩm
  const product = await Product.create(productData);

  return product;
};

/**
 * Cập nhật sản phẩm theo ID
 */
export const updateProductById = async (id, updateData) => {
  const product = await Product.findByPk(id);
  if (!product) throw new ValidationError("Không tìm thấy sản phẩm", 404);

  // Nếu tên thay đổi, cập nhật slug
  if (updateData.name) {
    updateData.slug = slugify(updateData.name, { lower: true });
  }

  await product.update(updateData);

  // Trả về sản phẩm đã cập nhật với thông tin đầy đủ
  return await Product.findByPk(id, {
    include: [
      {
        model: ProductImage,
        as: "images",
      },
      {
        model: Category,
        as: "category",
      },
    ],
  });
};

/**
 * Xóa sản phẩm theo ID
 */
export const removeProduct = async (id) => {
  const transaction = await db.sequelize.transaction();

  try {
    const product = await Product.findByPk(id);
    if (!product) throw new ValidationError("Không tìm thấy sản phẩm", 404);

    // Xóa ảnh liên quan
    await ProductImage.destroy({
      where: { productId: id },
      transaction,
    });

    // Xóa sản phẩm
    await product.destroy({ transaction });

    await transaction.commit();
    return { success: true, message: "Sản phẩm đã được xóa thành công" };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Upload nhiều ảnh cho sản phẩm
 */
export const uploadProductImages = async (productId, files) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new ValidationError("Không tìm thấy sản phẩm", 404);

  const transaction = await db.sequelize.transaction();

  try {
    // Sửa đoạn này để kiểm tra cấu trúc của từng file
    const productImages = files.map((file) => {
      // Nếu đối tượng đã có url (từ controller)
      if (file.url) {
        return {
          productId,
          url: file.url,
          isFeatured: file.isFeatured || false,
        };
      }
      // Nếu là file multer (từ middleware)
      else if (file.filename) {
        return {
          productId,
          url: `/uploads/products/${file.filename}`,
          isFeatured: file.isFeatured || false,
        };
      }
      // Nếu có đường dẫn đầy đủ
      else if (file.path) {
        // Chuyển Windows path (backslash) sang URL path (forward slash)
        const urlPath = file.path.replace(/\\/g, "/").replace("public/", "/");
        return {
          productId,
          url: urlPath,
          isFeatured: file.isFeatured || false,
        };
      }

      // Trường hợp không có thông tin đường dẫn
      throw new ValidationError("Thiếu thông tin đường dẫn ảnh");
    });

    const images = await ProductImage.bulkCreate(productImages, {
      transaction,
    });
    await transaction.commit();
    return images;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Đặt ảnh làm thumbnail cho sản phẩm
 */
export const setProductThumbnail = async (productId, imageId) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new ValidationError("Không tìm thấy sản phẩm", 404);

  const image = await ProductImage.findOne({
    where: { id: imageId, productId },
  });
  if (!image) throw new ValidationError("Không tìm thấy ảnh", 404);

  // Reset tất cả ảnh về không phải thumbnail
  await ProductImage.update({ isFeatured: false }, { where: { productId } });

  // Đặt ảnh được chọn làm thumbnail
  await image.update({ isFeatured: true });

  return { success: true };
};

/**
 * Thêm hoặc cập nhật các phương thức
 */
export const incrementViewCount = async (productId) => {
  await db.Product.increment("viewCount", { where: { id: productId } });
};

export const addProductImage = async (productId, imageData) => {
  return db.ProductImage.create({
    productId,
    ...imageData,
  });
};

export const updateProductImages = async (productId, images) => {
  // Xóa ảnh cũ
  await db.ProductImage.destroy({ where: { productId } });

  // Thêm ảnh mới
  if (images && images.length > 0) {
    return Promise.all(
      images.map((image, index) =>
        addProductImage(productId, {
          url: image.url,
          isFeatured: image.isFeatured || index === 0,
          altText: image.altText,
          sortOrder: image.sortOrder || index,
        })
      )
    );
  }
};

/**
 * Xóa một ảnh của sản phẩm
 */
export const deleteProductImage = async (productId, imageId) => {
  const image = await db.ProductImage.findOne({
    where: {
      id: imageId,
      productId: productId,
    },
  });

  if (!image) {
    throw new ValidationError("Không tìm thấy ảnh thuộc sản phẩm này", 404);
  }

  // Xóa file nếu cần
  // deleteFile(image.url);

  // Xóa record trong database
  await image.destroy();

  return true;
};

/**
 * Lấy danh sách sản phẩm nổi bật
 */
export const getFeatured = async (limit = 4) => {
  const products = await Product.findAll({
    where: {
      isFeatured: true,
      status: "active",
    },
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: ProductImage,
        as: "images",
        attributes: ["id", "url", "isFeatured"],
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
    ],
  });

  return products;
};

/**
 * Lấy danh sách sản phẩm liên quan
 */
export const getRelatedProducts = async (productId, limit = 4) => {
  // Tìm sản phẩm gốc
  const product = await Product.findByPk(productId);
  if (!product) throw new ValidationError("Không tìm thấy sản phẩm", 404);

  // Tìm các sản phẩm cùng danh mục
  const relatedProducts = await Product.findAll({
    where: {
      id: { [Op.ne]: productId }, // Không bao gồm sản phẩm hiện tại
      categoryId: product.categoryId, // Cùng danh mục
      status: "active",
    },
    limit: parseInt(limit),
    order: [
      ["viewCount", "DESC"], // Ưu tiên sản phẩm có nhiều lượt xem
      ["createdAt", "DESC"], // Sau đó đến sản phẩm mới
    ],
    include: [
      {
        model: ProductImage,
        as: "images",
        attributes: ["id", "url", "isFeatured"],
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
    ],
  });

  // Nếu không đủ sản phẩm liên quan, bổ sung sản phẩm khác
  if (relatedProducts.length < limit) {
    const additionalCount = limit - relatedProducts.length;
    const ids = [productId, ...relatedProducts.map((p) => p.id)];

    const additionalProducts = await Product.findAll({
      where: {
        id: { [Op.notIn]: ids },
        status: "active",
      },
      limit: additionalCount,
      order: [
        ["viewCount", "DESC"],
        ["createdAt", "DESC"],
      ],
      include: [
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "url", "isFeatured"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug"],
        },
      ],
    });

    return [...relatedProducts, ...additionalProducts];
  }

  return relatedProducts;
};

/**
 * Tăng số lượng bán ra
 */
export const incrementSaleCount = async (productId, quantity = 1) => {
  await Product.increment("saleCount", {
    by: quantity,
    where: { id: productId },
  });
  return true;
};
// ✅ Error handling nhất quán với ValidationError
// ✅ Phân trang rõ ràng với thông tin totalPages
// ✅ Xử lý sort linh hoạt và an toàn
// ✅ Xử lý filter đa dạng (danh mục, giá...)
// ✅ Transactions cho các thao tác phức tạp
// ✅ Auto-slugify từ tên sản phẩm
// ✅ Quản lý ảnh sản phẩm (upload, set thumbnail)
// ✅ Include related models khi cần
// ✅ Format response chuẩn
