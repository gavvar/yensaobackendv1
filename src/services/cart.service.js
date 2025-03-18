import db from "../models/index.js";
const { Cart, CartItem, Product } = db;

// Hàm lấy giỏ hàng của user; nếu chưa tồn tại thì tạo mới
export const getUserCart = async (userId) => {
  let cart = await Cart.findOne({
    where: { userId },
    include: [{ model: CartItem, include: [Product] }],
  });
  if (!cart) {
    cart = await Cart.create({ userId });
    cart = await Cart.findOne({
      where: { userId },
      include: [{ model: CartItem, include: [Product] }],
    });
  }
  return cart;
};

// Thêm sản phẩm vào giỏ: nếu sản phẩm đã có trong giỏ thì tăng số lượng, nếu chưa có thì tạo mới
export const addItemToCart = async (userId, { productId, quantity }) => {
  let cart = await Cart.findOne({ where: { userId } });
  if (!cart) {
    cart = await Cart.create({ userId });
  }
  let cartItem = await CartItem.findOne({
    where: { cartId: cart.id, productId },
    include: [Product],
  });
  if (cartItem) {
    const newQuantity = cartItem.quantity + quantity;
    await cartItem.update({ quantity: newQuantity });
  } else {
    cartItem = await CartItem.create({ cartId: cart.id, productId, quantity });
    cartItem = await CartItem.findOne({
      where: { id: cartItem.id },
      include: [Product],
    });
  }
  return cartItem;
};

// Cập nhật số lượng sản phẩm trong giỏ theo cartItemId
export const updateCartItem = async (cartItemId, quantity) => {
  const cartItem = await CartItem.findByPk(cartItemId, { include: [Product] });
  if (!cartItem) throw new Error("Cart item not found");
  await cartItem.update({ quantity });
  return cartItem;
};

// Xoá sản phẩm khỏi giỏ theo cartItemId
export const removeCartItem = async (cartItemId) => {
  const cartItem = await CartItem.findByPk(cartItemId);
  if (!cartItem) throw new Error("Cart item not found");
  await cartItem.destroy();
};
