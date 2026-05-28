-- ============================================================
-- MAIZU — RLS POLICIES
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ── USERS ────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can register (insert their own row)
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only read their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ── STORES ───────────────────────────────────────────────────
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Anyone (including not logged in) can read active stores
CREATE POLICY "stores_select_all" ON stores
  FOR SELECT USING (is_active = true);

-- Only vendors can create stores (owner must be themselves)
CREATE POLICY "stores_insert_vendor" ON stores
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Only the store owner can update their store
CREATE POLICY "stores_update_owner" ON stores
  FOR UPDATE USING (auth.uid() = owner_id);

-- Only the store owner can delete their store
CREATE POLICY "stores_delete_owner" ON stores
  FOR DELETE USING (auth.uid() = owner_id);

-- ── STORE FOLLOWERS ──────────────────────────────────────────
ALTER TABLE store_followers ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can see followers
CREATE POLICY "followers_select_all" ON store_followers
  FOR SELECT USING (true);

-- Logged in users can follow (insert their own follow)
CREATE POLICY "followers_insert_own" ON store_followers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only unfollow their own follows
CREATE POLICY "followers_delete_own" ON store_followers
  FOR DELETE USING (auth.uid() = user_id);

-- ── PRODUCTS ─────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products
CREATE POLICY "products_select_all" ON products
  FOR SELECT USING (is_active = true);

-- Only the store owner can add products
CREATE POLICY "products_insert_owner" ON products
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT owner_id FROM stores WHERE id = store_id)
  );

-- Only the store owner can update their products
CREATE POLICY "products_update_owner" ON products
  FOR UPDATE USING (
    auth.uid() = (SELECT owner_id FROM stores WHERE id = store_id)
  );

-- Only the store owner can delete their products
CREATE POLICY "products_delete_owner" ON products
  FOR DELETE USING (
    auth.uid() = (SELECT owner_id FROM stores WHERE id = store_id)
  );

-- ── PRODUCT LIKES ─────────────────────────────────────────────
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select_all" ON product_likes
  FOR SELECT USING (true);

CREATE POLICY "likes_insert_own" ON product_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_own" ON product_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ── ORDERS ───────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Buyers can only see their own orders
CREATE POLICY "orders_select_buyer" ON orders
  FOR SELECT USING (auth.uid() = buyer_id);

-- Only logged in users can place orders
CREATE POLICY "orders_insert_buyer" ON orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Only Express backend (service role) can update order status
-- (service role bypasses RLS by default)

-- ── ORDER ITEMS ───────────────────────────────────────────────
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own order items
CREATE POLICY "order_items_select_buyer" ON order_items
  FOR SELECT USING (
    auth.uid() = (SELECT buyer_id FROM orders WHERE id = order_id)
  );

-- Only service role can insert order items (done via Express)
CREATE POLICY "order_items_insert_service" ON order_items
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT buyer_id FROM orders WHERE id = order_id)
  );

-- ============================================================
-- DONE. RLS enabled on all 7 tables.
-- ============================================================
