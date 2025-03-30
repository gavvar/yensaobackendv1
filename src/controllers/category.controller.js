import {
  listCategories,
  fetchCategoryBySlug,
  addCategory,
  updateCategoryById,
  removeCategory,
  reorderCategories,
} from "../services/category.service.js";

/**
 * Lấy danh sách danh mục
 * Validation đã được xử lý qua middleware validate(categorySchemas.getCategories, 'query')
 */
export const getCategories = async (req, res, next) => {
  try {
    const { page, limit, isActive, parentId } = req.query;

    const result = await listCategories({
      page,
      limit,
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
      parentId: parentId !== undefined ? parseInt(parentId) : undefined,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết danh mục theo slug
 */
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await fetchCategoryBySlug(slug);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo danh mục mới
 * Validation đã được xử lý qua middleware validate(categorySchemas.create)
 */
export const createCategory = async (req, res, next) => {
  try {
    // Sử dụng service function đã import
    const newCategory = await addCategory({
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description,
      metaTitle: req.body.metaTitle,
      metaDescription: req.body.metaDescription,
    });

    res.status(201).json({
      success: true,
      data: newCategory,
      message: "Danh mục đã được tạo thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật danh mục
 * Validation đã được xử lý qua middleware validate(categorySchemas.update)
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await updateCategoryById(id, updateData);

    res.status(200).json({
      success: true,
      data: category,
      message: "Danh mục đã được cập nhật thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa danh mục
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await removeCategory(id);

    res.status(200).json({
      success: true,
      message: "Danh mục đã được xóa thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sắp xếp lại danh mục
 * Validation đã được xử lý qua middleware validate(categorySchemas.reorder)
 */
export const reorderCategoryList = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    await reorderCategories(orderedIds);

    res.status(200).json({
      success: true,
      message: "Đã cập nhật thứ tự danh mục",
    });
  } catch (error) {
    next(error);
  }
};
