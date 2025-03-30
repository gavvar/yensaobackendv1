import db from "../models/index.js";
import { Op } from "sequelize"; // Thêm dòng này
const { Cart, CartItem, Product } = db;

// Sửa getUserCart service để sử dụng getCartWithProducts
export const getUserCart = async (userId) => {
  let cart = await Cart.findOne({
    where: { userId, status: "active" },
    include: [
      {
        model: CartItem,
        include: [
          {
            model: Product,
            include: [
              {
                model: db.ProductImage,
                as: "images",
                attributes: ["id", "url", "isFeatured"],
                required: false,
              },
            ],
          },
        ],
      },
    ],
  });

  if (!cart) {
    cart = await Cart.create({
      userId,
      status: "active",
    });

    // Tạo cart mới với include đầy đủ
    cart = await Cart.findOne({
      where: { id: cart.id },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: Product,
              include: [
                {
                  model: db.ProductImage,
                  as: "images",
                  attributes: ["id", "url", "isFeatured"],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });
  }

  return cart;
};

// Sửa lại cart.service.js
export const addItemToCart = async (userId, { productId, quantity, notes }) => {
  // Kiểm tra sản phẩm tồn tại và còn hàng
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new ValidationError("Sản phẩm không tồn tại");
  }

  if (product.status !== "active") {
    throw new ValidationError("Sản phẩm không khả dụng");
  }

  if (product.quantity < quantity) {
    throw new ValidationError(`Chỉ còn ${product.quantity} sản phẩm trong kho`);
  }

  // Tiếp tục logic hiện tại
  const [cart] = await Cart.findOrCreate({
    where: { userId, status: "active" },
  });

  let cartItem = await CartItem.findOne({
    where: { cartId: cart.id, productId },
    include: [Product],
  });
  if (cartItem) {
    const newQuantity = cartItem.quantity + quantity;
    await cartItem.update({ quantity: newQuantity });
  } else {
    cartItem = await CartItem.create({
      cartId: cart.id,
      productId,
      quantity,
      notes,
    });
    cartItem = await CartItem.findOne({
      where: { id: cartItem.id },
      include: [Product],
    });
  }
  return cartItem;
};

// Cập nhật số lượng sản phẩm trong giỏ theo cartItemId
export const updateCartItem = async (cartItemId, quantity) => {
  const cartItem = await CartItem.findByPk(cartItemId, {
    include: [Product],
  });

  if (!cartItem) throw new Error("Cart item not found");

  // Nếu số lượng <= 0, xóa khỏi giỏ hàng
  if (quantity <= 0) {
    await cartItem.destroy();
    return { id: cartItemId, removed: true, message: "Item removed from cart" };
  }

  // Kiểm tra tồn kho
  if (cartItem.Product.quantity < quantity) {
    throw new ValidationError(
      `Chỉ còn ${cartItem.Product.quantity} sản phẩm trong kho`
    );
  }

  // Ngược lại, cập nhật số lượng
  await cartItem.update({ quantity });
  return cartItem;
};

// Thiếu hàm updateCartItemBatch trong service
export const updateCartItemBatch = async (cartItemId, updates) => {
  const cartItem = await CartItem.findByPk(cartItemId, { include: [Product] });
  if (!cartItem) throw new Error("Cart item not found");

  // Xử lý quantity
  if (updates.quantity !== undefined) {
    if (updates.quantity <= 0) {
      await cartItem.destroy();
      return { id: cartItemId, removed: true };
    }
    await cartItem.update({ quantity: updates.quantity });
  }

  // Xử lý selectedForCheckout
  if (updates.selected !== undefined) {
    await cartItem.update({ selectedForCheckout: !!updates.selected });
  }

  // Xử lý notes
  if (updates.notes !== undefined) {
    await cartItem.update({ notes: updates.notes });
  }

  return cartItem;
};

// Xoá sản phẩm khỏi giỏ theo cartItemId
export const removeCartItem = async (cartItemId) => {
  const cartItem = await CartItem.findByPk(cartItemId);
  if (!cartItem) throw new Error("Cart item not found");
  await cartItem.destroy();
};

// Sửa đổi hàm getCartWithProducts để bao gồm thông tin hình ảnh
export const getCartWithProducts = async (userId) => {
  const cart = await Cart.findOne({
    where: { userId, status: "active" },
    include: [
      {
        model: CartItem,
        include: [
          {
            model: Product,
            attributes: [
              "id",
              "name",
              "price",
              "discountPrice",
              "status",
              "quantity",
              "slug", // Thêm slug để frontend có thể tạo link
            ],
            include: [
              {
                model: db.ProductImage,
                as: "images",
                attributes: ["id", "url", "isFeatured"],
                required: false,
              },
            ],
          },
        ],
      },
    ],
  });

  if (!cart) {
    // Tạo cart mới nếu không tìm thấy
    return {
      id: null,
      items: [],
      total: 0,
      itemCount: 0,
    };
  }

  // Tính toán với giá hiện tại
  const items = cart.CartItems.map((item) => {
    const product = item.Product;
    const currentPrice = product.discountPrice || product.price;

    // Xử lý thông tin hình ảnh
    let productImages = [];
    if (product.images && product.images.length > 0) {
      productImages = product.images.map((img) => ({
        id: img.id,
        url: img.url,
        isFeatured: img.isFeatured,
      }));
    }

    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      notes: item.notes,
      selectedForCheckout: item.selectedForCheckout,
      product: {
        id: product.id,
        name: product.name,
        price: currentPrice,
        originalPrice: product.price,
        isOnSale: !!product.discountPrice,
        slug: product.slug,
        images: productImages, // Thêm thông tin hình ảnh
      },
      subtotal: currentPrice * item.quantity,
    };
  });

  return {
    id: cart.id,
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0),
    itemCount: items.length,
  };
};

// Thêm vào cart.service.js
export const updateItemSelectedStatus = async (cartItemId, selected) => {
  const cartItem = await CartItem.findByPk(cartItemId);
  if (!cartItem) throw new Error("Cart item not found");

  await cartItem.update({ selectedForCheckout: !!selected });
  return cartItem;
};

export const updateItemNotes = async (cartItemId, notes) => {
  const cartItem = await CartItem.findByPk(cartItemId);
  if (!cartItem) throw new Error("Cart item not found");

  await cartItem.update({ notes });
  return cartItem;
};

// Thêm trong cart.service.js
export const cleanupAbandonedCarts = async (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - days);

  // Đánh dấu cart cũ là abandoned
  await Cart.update(
    { status: "abandoned" },
    {
      where: {
        updatedAt: { [Op.lt]: date },
        status: "active",
      },
    }
  );

  return true;
};

// Thiếu hàm checkItemBelongsToUser trong service
export const checkItemBelongsToUser = async (cartItemId, userId) => {
  const count = await CartItem.count({
    where: { id: cartItemId },
    include: [
      {
        model: Cart,
        where: { userId, status: "active" },
      },
    ],
  });
  return count > 0;
};

/**
 * Xóa giỏ hàng của người dùng sau khi đặt hàng
 */
export const clearUserCart = async (userId, transaction = null) => {
  const cart = await getUserCart(userId);

  const options = transaction ? { transaction } : {};

  // Xóa tất cả cart items
  await CartItem.destroy({
    where: { cartId: cart.id },
    ...options,
  });

  // Cập nhật giỏ hàng
  await cart.update(
    {
      totalPrice: 0,
    },
    options
  );

  return true;
};

/**
 * Xóa nhiều sản phẩm khỏi giỏ hàng cùng lúc
 * @param {Array} cartItemIds - Mảng ID các sản phẩm cần xóa
 * @param {number} userId - ID của người dùng (để kiểm tra quyền)
 * @returns {Object} - Kết quả xóa
 */
export const removeManyCartItems = async (cartItemIds, userId) => {
  // Kiểm tra userId để đảm bảo người dùng chỉ xóa các mục trong giỏ hàng của họ
  const cart = await Cart.findOne({
    where: { userId, status: "active" },
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  // Xác thực: Đảm bảo tất cả cartItemIds thuộc về giỏ hàng của người dùng
  const cartItems = await CartItem.findAll({
    where: {
      id: { [Op.in]: cartItemIds },
      cartId: cart.id,
    },
  });

  // Nếu số lượng kết quả tìm được khác với số lượng ID yêu cầu,
  // có một số ID không thuộc về người dùng hoặc không tồn tại
  if (cartItems.length !== cartItemIds.length) {
    const foundIds = cartItems.map((item) => item.id);
    const invalidIds = cartItemIds.filter(
      (id) => !foundIds.includes(parseInt(id))
    );

    throw new Error(
      `Một số mục không tồn tại hoặc không thuộc về giỏ hàng của bạn: ${invalidIds.join(
        ", "
      )}`
    );
  }

  // Thực hiện xóa
  const deletedCount = await CartItem.destroy({
    where: {
      id: { [Op.in]: cartItemIds },
      cartId: cart.id,
    },
  });

  return {
    success: true,
    deletedCount,
    deletedItems: cartItemIds,
  };
};
