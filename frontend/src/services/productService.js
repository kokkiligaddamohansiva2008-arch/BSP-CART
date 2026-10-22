import axios from "axios";

const BASE_URL = "http://localhost:8080/api/products";

/**
 * Get all products
 */
export const getAllProducts = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

/**
 * Get product by ID
 */
export const getProductById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * Search products
 */
export const searchProducts = async (keyword) => {
  const response = await axios.get(
    `${BASE_URL}/search?keyword=${keyword}`
  );
  return response.data;
};

/**
 * Products by category
 */
export const getProductsByCategory = async (categoryId) => {
  const response = await axios.get(
    `${BASE_URL}/category/${categoryId}`
  );
  return response.data;
};

/**
 * Seller - Add Product
 */
export const addProduct = async (product) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    BASE_URL,
    product,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};

/**
 * Seller - Update Product
 */
export const updateProduct = async (id, product) => {

  const token = localStorage.getItem("token");

  const response = await axios.put(
    `${BASE_URL}/${id}`,
    product,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};

/**
 * Seller - Delete Product
 */
export const deleteProduct = async (id) => {

  const token = localStorage.getItem("token");

  const response = await axios.delete(
    `${BASE_URL}/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};