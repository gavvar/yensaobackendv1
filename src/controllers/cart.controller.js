import {
  getUserCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
} from "../services/cart.service.js";

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await getUserCart(userId);
    res.status(200).json(cart);
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    const cartItem = await addItemToCart(userId, { productId, quantity });
    res.status(201).json(cartItem);
  } catch (error) {
    next(error);
  }
};

export const updateCart = async (req, res, next) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const updatedItem = await updateCartItem(cartItemId, quantity);
    res.status(200).json(updatedItem);
  } catch (error) {
    next(error);
  }
};

export const deleteCartItem = async (req, res, next) => {
  try {
    const { cartItemId } = req.params;
    await removeCartItem(cartItemId);
    res.status(200).json({ message: "Cart item removed successfully" });
  } catch (error) {
    next(error);
  }
};
