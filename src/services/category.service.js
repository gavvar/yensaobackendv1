import db from "../models/index.js";
import slugify from "slugify";
import { ValidationError } from "../utils/errors.js";

const { Category, Product, Sequelize } = db;
const { Op } = Sequelize;

/**
 * Lấy danh sách danh mục (có thể lọc theo trạng thái, parent, v.v.)
 */
export const listCategories = async ({
  page,
  limit,
  isActive,
  parentId,
} = {}) => {
  const options = {
    where: {},
    order: [
      ["sortOrder", "ASC"],
      ["name", "ASC"],
    ],
  };

  // Filter theo trạng thái nếu được chỉ định
  if (isActive !== undefined) {
    options.where.isActive = isActive;
  }

  // Filter theo parent nếu được chỉ định
  if (parentId !== undefined) {
    options.where.parentId = parentId === 0 ? null : parentId;
  }

  // Nếu có pagination
  if (page && limit) {
    const offset = (page - 1) * limit;
    options.limit = parseInt(limit);
    options.offset = offset;

    const { count, rows } = await Category.findAndCountAll(options);
    return {
      categories: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Nếu không có pagination, trả về tất cả
  const categories = await Category.findAll(options);
  return { categories };
};

/**
 * Lấy danh mục theo slug
 */
export const fetchCategoryBySlug = async (slug) => {
  const category = await Category.findOne({
    where: { slug },
    include: [
      {
        model: Category,
        as: "children",
        attributes: ["id", "name", "slug", "imageUrl"],
      },
      {
        model: Product,
        as: "products",
        limit: 10,
        order: [["createdAt", "DESC"]],
      },
    ],
  });

  if (!category) throw new ValidationError("Không tìm thấy danh mục", 404);
  return category;
};

/**
 * Thêm danh mục mới
 */
export const addCategory = async (data) => {
  // Slug sẽ được tạo tự động qua hook trong model
  // Kiểm tra trùng lặp tên hoặc slug
  const existingCategory = await Category.findOne({
    where: {
      [Op.or]: [
        { name: data.name },
        { slug: slugify(data.name, { lower: true, strict: true }) },
      ],
    },
  });

  if (existingCategory) {
    throw new ValidationError("Tên danh mục đã tồn tại");
  }

  const category = await Category.create(data);
  return category;
};

/**
 * Cập nhật danh mục theo ID
 */
export const updateCategoryById = async (id, updateData) => {
  const category = await Category.findByPk(id);
  if (!category) throw new ValidationError("Không tìm thấy danh mục", 404);

  // Kiểm tra trùng tên với các danh mục khác
  if (updateData.name) {
    const existingCategory = await Category.findOne({
      where: {
        name: updateData.name,
        id: { [Op.ne]: id },
      },
    });

    if (existingCategory) {
      throw new ValidationError("Tên danh mục đã tồn tại");
    }
  }

  await category.update(updateData);
  return category;
};

/**
 * Xóa danh mục theo ID
 */
export const removeCategory = async (id) => {
  const transaction = await db.sequelize.transaction();

  try {
    const category = await Category.findByPk(id);
    if (!category) throw new ValidationError("Không tìm thấy danh mục", 404);

    // Kiểm tra xem có sản phẩm nào thuộc danh mục này không
    const productCount = await Product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new ValidationError("Không thể xóa danh mục đang chứa sản phẩm");
    }

    // Kiểm tra xem có danh mục con nào không
    const childrenCount = await Category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new ValidationError(
        "Không thể xóa danh mục đang chứa danh mục con"
      );
    }

    await category.destroy({ transaction });
    await transaction.commit();

    return { success: true, message: "Đã xóa danh mục thành công" };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Sắp xếp lại các danh mục
 */
export const reorderCategories = async (orderedIds) => {
  const transaction = await db.sequelize.transaction();

  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await Category.update(
        { sortOrder: i },
        {
          where: { id: orderedIds[i] },
          transaction,
        }
      );
    }

    await transaction.commit();
    return { success: true, message: "Đã cập nhật thứ tự danh mục" };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
