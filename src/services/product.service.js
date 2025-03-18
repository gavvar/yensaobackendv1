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
        attributes: ["id", "url", "isFeatured"],
        required: false,
      },
      {
        model: Category,
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
        attributes: ["id", "url", "isFeatured"],
      },
      {
        model: Category,
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
export const addProduct = async (data) => {
  const transaction = await db.sequelize.transaction();

  try {
    // Tự động tạo slug từ tên sản phẩm
    data.slug = slugify(data.name || "", { lower: true });

    const product = await Product.create(data, { transaction });

    // Xử lý ảnh sản phẩm nếu có
    if (data.images && Array.isArray(data.images)) {
      await ProductImage.bulkCreate(
        data.images.map((img) => ({
          ...img,
          productId: product.id,
        })),
        { transaction }
      );
    }

    await transaction.commit();

    // Lấy sản phẩm với thông tin đầy đủ
    return await Product.findByPk(product.id, {
      include: [{ model: ProductImage }],
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
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
    include: [{ model: ProductImage }],
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
    const productImages = files.map((file) => ({
      productId,
      url: file.path,
      isFeatured: false,
    }));

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
// ✅ Error handling nhất quán với ValidationError
// ✅ Phân trang rõ ràng với thông tin totalPages
// ✅ Xử lý sort linh hoạt và an toàn
// ✅ Xử lý filter đa dạng (danh mục, giá...)
// ✅ Transactions cho các thao tác phức tạp
// ✅ Auto-slugify từ tên sản phẩm
// ✅ Quản lý ảnh sản phẩm (upload, set thumbnail)
// ✅ Include related models khi cần
// ✅ Format response chuẩn
