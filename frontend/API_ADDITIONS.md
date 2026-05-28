// ─────────────────────────────────────────────────────────────
// ADD THESE TWO FUNCTIONS inside your ordersApi object
// in frontend/utils/api.ts
//
// Find:
//   updateStatus: async (id: string, status: Order["status"]) => { ... }
//
// Make sure your ordersApi includes all of these:
// ─────────────────────────────────────────────────────────────

// getStoreOrders — fetches all orders for a specific store (vendor only)
// Usage: const orders = await ordersApi.getStoreOrders(storeId);
//
// Add this inside ordersApi in api.ts:
//
//   getStoreOrders: async (storeId: string) => {
//     const res = await request<{ success: boolean; orders: Order[] }>(
//       `/api/orders/store/${storeId}`
//     );
//     return res.orders;
//   },
//
//   updateStatus: async (id: string, status: Order["status"]) => {
//     return request(`/api/orders/${id}/status`, {
//       method: "PUT",
//       body: JSON.stringify({ status }),
//     });
//   },
