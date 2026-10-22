import api from "./api";

/*
|--------------------------------------------------------------------------
| Place Order
|--------------------------------------------------------------------------
*/

export const placeOrder = async (orderData) => {
  const response = await api.post("/orders", orderData);
  return response.data;
};

/*
|--------------------------------------------------------------------------
| Get Logged-in User Orders
|--------------------------------------------------------------------------
*/

export const getMyOrders = async () => {
  const response = await api.get("/orders/my");
  return response.data;
};

/*
|--------------------------------------------------------------------------
| Get Order By ID
|--------------------------------------------------------------------------
*/

export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

/*
|--------------------------------------------------------------------------
| Cancel Order
|--------------------------------------------------------------------------
*/

export const cancelOrder = async (orderId) => {
  const response = await api.put(`/orders/${orderId}/cancel`);
  return response.data;
};

/*
|--------------------------------------------------------------------------
| Seller Orders
|--------------------------------------------------------------------------
*/

export const getSellerOrders = async () => {
  const response = await api.get("/orders/seller");
  return response.data;
};

/*
|--------------------------------------------------------------------------
| Update Order Status
|--------------------------------------------------------------------------
*/

export const updateOrderStatus = async (
  orderId,
  status
) => {
  const response = await api.put(
    `/orders/${orderId}/status`,
    { status }
  );

  return response.data;
};