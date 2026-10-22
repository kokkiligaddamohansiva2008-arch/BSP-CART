import axios from "axios";

const BASE_URL = "http://localhost:8080/api/cart";

const getToken = () => {
  return localStorage.getItem("token");
};

/**
 * Get Cart
 */
export const getCart = async () => {

  const response = await axios.get(BASE_URL, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  return response.data;
};

/**
 * Add Item
 */
export const addToCart = async (
  productId,
  quantity = 1
) => {

  const response = await axios.post(
    `${BASE_URL}/add`,
    {
      productId,
      quantity
    },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );

  return response.data;
};

/**
 * Increase Quantity
 */
export const increaseQuantity = async (
  cartItemId
) => {

  const response = await axios.put(
    `${BASE_URL}/increase/${cartItemId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );

  return response.data;
};

/**
 * Decrease Quantity
 */
export const decreaseQuantity = async (
  cartItemId
) => {

  const response = await axios.put(
    `${BASE_URL}/decrease/${cartItemId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );

  return response.data;
};

/**
 * Remove Item
 */
export const removeCartItem = async (
  cartItemId
) => {

  const response = await axios.delete(
    `${BASE_URL}/remove/${cartItemId}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );

  return response.data;
};

/**
 * Clear Cart
 */
export const clearCart = async () => {

  const response = await axios.delete(
    `${BASE_URL}/clear`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );

  return response.data;
};