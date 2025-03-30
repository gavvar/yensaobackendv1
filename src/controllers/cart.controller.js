import {
  getUserCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  updateItemSelectedStatus,
  updateItemNotes,
  removeManyCartItems,
} from "../services/cart.service.js";

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await getUserCart(userId);

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, notes } = req.body;
    const cartItem = await addItemToCart(userId, {
      productId,
      quantity,
      notes,
    });

    res.status(201).json({
      success: true,
      data: cartItem,
      message: "Đã thêm vào giỏ hàng",
    });
  } catch (error) {
    next(error);
  }
};

// Sửa controller updateCart
export const updateCart = async (req, res, next) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const updatedItem = await updateCartItem(cartItemId, quantity);

    // Phản hồi chuẩn hóa
    res.status(200).json({
      success: true,
      data: updatedItem,
      message: updatedItem.removed
        ? "Sản phẩm đã được xóa khỏi giỏ hàng"
        : "Đã cập nhật số lượng",
    });
  } catch (error) {
    next(error);
  }
};

// Sửa controller deleteCartItem
export const deleteCartItem = async (req, res, next) => {
  try {
    const { cartItemId } = req.params;
    await removeCartItem(cartItemId);

    // Phản hồi chuẩn hóa
    res.status(200).json({
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
    });
  } catch (error) {
    next(error);
  }
};

// Thêm controller mới
export const toggleSelectedStatus = async (req, res, next) => {
  try {
    const { cartItemId } = req.params;
    const { selected } = req.body;

    // Cần thêm hàm mới trong service
    const result = await updateItemSelectedStatus(cartItemId, selected);

    res.status(200).json({
      success: true,
      data: result,
      message: selected
        ? "Đã chọn sản phẩm để thanh toán"
        : "Đã bỏ chọn sản phẩm",
    });
  } catch (error) {
    next(error);
  }
};

// Thêm controller cập nhật ghi chú
export const updateCartItemNotes = async (req, res, next) => {
  try {
    const { cartItemId } = req.params;
    const { notes } = req.body;

    // Cần thêm hàm mới trong service
    const result = await updateItemNotes(cartItemId, notes);

    res.status(200).json({
      success: true,
      data: result,
      message: "Đã cập nhật ghi chú",
    });
  } catch (error) {
    next(error);
  }
};

// Thêm controller
export const batchUpdateCartItems = async (req, res, next) => {
  try {
    const { items } = req.body; // [{ id: 1, quantity: 2, selected: true }, ...]
    const userId = req.user.id;

    const results = await Promise.all(
      items.map(async (item) => {
        // Kiểm tra ownership trước
        const owned = await checkItemBelongsToUser(item.id, userId);
        if (!owned)
          return { id: item.id, updated: false, error: "Unauthorized" };

        // Cập nhật item
        return updateCartItemBatch(item.id, item);
      })
    );

    res.status(200).json({
      success: true,
      data: results,
      message: "Đã cập nhật giỏ hàng",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa nhiều sản phẩm khỏi giỏ hàng cùng lúc
 */
export const deleteManyCartItems = async (req, res, next) => {
  try {
    const { items } = req.body; // Mảng các ID cần xóa
    const userId = req.user.id;

    // Kiểm tra dữ liệu đầu vào
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng cung cấp danh sách ID sản phẩm cần xóa",
      });
    }

    // Gọi service để xóa
    const result = await removeManyCartItems(items, userId);

    return res.status(200).json({
      success: true,
      data: result,
      message: `Đã xóa ${result.deletedCount} sản phẩm khỏi giỏ hàng`,
    });
  } catch (error) {
    next(error);
  }
};
