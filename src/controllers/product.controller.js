import {
  listProducts,
  fetchProductBySlug,
  addProduct,
  updateProductById,
  removeProduct,
  uploadProductImages,
  setProductThumbnail,
} from "../services/product.service.js";

/**
 * Lấy danh sách sản phẩm
 * Validation đã được xử lý qua middleware validate(productSchemas.getProducts, 'query')
 */
export const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort, filter, search } = req.query;

    const products = await listProducts({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      filter,
      search,
    });

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết sản phẩm theo slug
 */
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await fetchProductBySlug(slug);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo sản phẩm mới
 * Validation đã được xử lý qua middleware validate(productSchemas.create)
 */
export const createProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    const product = await addProduct(productData);

    res.status(201).json({
      success: true,
      data: product,
      message: "Sản phẩm đã được tạo thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật sản phẩm
 * Validation đã được xử lý qua middleware validate(productSchemas.update)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await updateProductById(id, updateData);

    res.status(200).json({
      success: true,
      data: product,
      message: "Sản phẩm đã được cập nhật thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa sản phẩm
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await removeProduct(id);

    res.status(200).json({
      success: true,
      message: "Sản phẩm đã được xóa thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload ảnh cho sản phẩm
 */
export const uploadImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const files = req.files; // Giả định đã cấu hình multer middleware

    const images = await uploadProductImages(productId, files);

    res.status(201).json({
      success: true,
      data: images,
      message: "Upload ảnh thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Đặt ảnh làm thumbnail
 */
export const setThumbnail = async (req, res, next) => {
  try {
    const { productId, imageId } = req.params;
    await setProductThumbnail(productId, imageId);

    res.status(200).json({
      success: true,
      message: "Đã đặt ảnh làm thumbnail",
    });
  } catch (error) {
    next(error);
  }
};
