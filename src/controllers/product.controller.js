import {
  listProducts,
  fetchProductBySlug,
  addProduct,
  updateProductById,
  removeProduct,
  uploadProductImages,
  setProductThumbnail,
  deleteProductImage,
  fetchProductById,
  getFeatured,
  incrementViewCount,
  getRelatedProducts as getRelatedProductsService,
} from "../services/product.service.js";
import db from "../models/index.js";
const { Product, ProductImage, Category } = db;

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
 * Lấy chi tiết sản phẩm theo id
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await fetchProductById(parseInt(id, 10));

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
    console.log("======= DEBUG =======");
    console.log("REQ.BODY:", JSON.stringify(req.body, null, 2));
    console.log(
      "req.productData:",
      req.productData
        ? JSON.stringify(req.productData).substring(0, 50) + "..."
        : "undefined"
    );

    // Lấy dữ liệu từ req.productData
    const productData = req.productData || {};

    // Validate trực tiếp trong controller
    if (!productData.name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    if (!productData.price) {
      return res.status(400).json({
        success: false,
        error: "Price is required",
      });
    }

    // Chuyển đổi categoryId từ string sang number nếu cần
    if (productData.categoryId && typeof productData.categoryId === "string") {
      productData.categoryId = parseInt(productData.categoryId, 10);
    }

    // Tiếp tục tạo sản phẩm
    const product = await addProduct(productData);

    // Xử lý ảnh thumbnail
    if (req.files && req.files.thumbnail && req.files.thumbnail.length > 0) {
      const thumbnailFile = req.files.thumbnail[0];
      console.log("THUMBNAIL FILE:", JSON.stringify(thumbnailFile));

      // Sửa đổi từ đây: tạo đối tượng mới với các thuộc tính cần thiết
      const thumbnailUpload = {
        url: `/uploads/products/${thumbnailFile.filename}`,
        isFeatured: true,
      };

      await uploadProductImages(product.id, [thumbnailUpload]);
    }

    // Xử lý nhiều ảnh khác
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imageUploads = req.files.images.map((file) => ({
        url: `/uploads/products/${file.filename}`,
        isFeatured: false,
      }));

      await uploadProductImages(product.id, imageUploads);
    }

    // Lấy sản phẩm với images
    const productWithImages = await fetchProductById(product.id);

    return res.status(201).json({
      success: true,
      data: { product: productWithImages },
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

    // Nếu có productData, parse data từ đó
    let updateData = req.body;

    if (req.productData) {
      updateData = req.productData;
    }

    // Chuyển đổi categoryId nếu cần
    if (updateData.categoryId && typeof updateData.categoryId === "string") {
      updateData.categoryId = parseInt(updateData.categoryId, 10);
    }

    const product = await updateProductById(id, updateData);

    // Xử lý ảnh nếu có
    if (req.files) {
      // Xử lý ảnh thumbnail
      if (req.files.thumbnail && req.files.thumbnail.length > 0) {
        const thumbnailFile = req.files.thumbnail[0];

        const thumbnailUpload = {
          url: `/uploads/products/${thumbnailFile.filename}`,
          isFeatured: true,
        };

        await uploadProductImages(id, [thumbnailUpload]);
      }

      // Xử lý nhiều ảnh khác
      if (req.files.images && req.files.images.length > 0) {
        const imageUploads = req.files.images.map((file) => ({
          url: `/uploads/products/${file.filename}`,
          isFeatured: false,
        }));

        await uploadProductImages(id, imageUploads);
      }
    }

    const updatedProduct = await fetchProductById(id);

    return res.status(200).json({
      success: true,
      data: { product: updatedProduct },
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

/**
 * Xóa một ảnh của sản phẩm
 */
export const deleteImage = async (req, res, next) => {
  try {
    const { productId, imageId } = req.params;

    // Gọi service để xóa ảnh
    await deleteProductImage(productId, imageId);

    res.status(200).json({
      success: true,
      message: "Ảnh đã được xóa thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getCartSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await getUserCartSummary(userId);

    res.status(200).json({
      success: true,
      data: {
        totalItems: cart.totalItems,
        totalValue: cart.totalValue,
        selectedItems: cart.selectedItems,
        selectedValue: cart.selectedValue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Service tương ứng
export const getUserCartSummary = async (userId) => {
  const cart = await Cart.findOne({
    where: { userId, status: "active" },
    include: [
      {
        model: CartItem,
        include: [Product],
      },
    ],
  });

  if (!cart)
    return { totalItems: 0, totalValue: 0, selectedItems: 0, selectedValue: 0 };

  const totalItems = cart.CartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalValue = cart.CartItems.reduce((sum, item) => {
    const price = item.Product.discountPrice || item.Product.price;
    return sum + price * item.quantity;
  }, 0);

  const selectedItems = cart.CartItems.filter(
    (item) => item.selectedForCheckout
  ).reduce((sum, item) => sum + item.quantity, 0);

  const selectedValue = cart.CartItems.filter(
    (item) => item.selectedForCheckout
  ).reduce((sum, item) => {
    const price = item.Product.discountPrice || item.Product.price;
    return sum + price * item.quantity;
  }, 0);

  return { totalItems, totalValue, selectedItems, selectedValue };
};

/**
 * Lấy danh sách sản phẩm nổi bật
 */
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 4 } = req.query;
    const featuredProducts = await getFeatured(limit);

    return res.status(200).json({
      success: true,
      data: featuredProducts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy sản phẩm theo danh mục
 */
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Tìm danh mục theo slug
    const category = await Category.findOne({
      where: { slug },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy danh mục",
      });
    }

    // Tìm sản phẩm thuộc danh mục
    const { count, rows } = await Product.findAndCountAll({
      where: {
        categoryId: category.id,
        status: "active",
      },
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
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

    return res.status(200).json({
      success: true,
      data: {
        products: rows,
        category,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tăng lượt xem sản phẩm
 */
export const viewProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra sản phẩm tồn tại
    const product = await fetchProductById(id);

    // Tăng lượt xem
    await incrementViewCount(id);

    return res.status(200).json({
      success: true,
      message: "Đã tăng lượt xem sản phẩm",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy sản phẩm liên quan
 */
export const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    const relatedProducts = await getRelatedProductsService(id, limit);

    return res.status(200).json({
      success: true,
      data: relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};
