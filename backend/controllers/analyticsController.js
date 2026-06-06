const { query } = require("../config/db");

/* ── GET VENDOR ANALYTICS ── GET /api/analytics/vendor ──────── */
const getVendorAnalytics = async (req, res) => {
  const vendorId = req.user.id;

  try {
    /* Get all stores for this vendor */
    const storesResult = await query(
      "SELECT id, name, logo_url, product_count, follower_count, rating FROM stores WHERE owner_id = $1",
      [vendorId]
    );
    const stores   = storesResult.rows;
    const storeIds = stores.map(function(s) { return s.id; });

    if (storeIds.length === 0) {
      return res.status(200).json({
        success: true,
        stores:  [],
        summary: { total_revenue: 0, total_orders: 0, total_products: 0, total_followers: 0, this_week_revenue: 0, last_week_revenue: 0, revenue_growth: "0", orders_this_week: 0, orders_last_week: 0 },
        charts:  { daily_revenue: [], weekly_revenue: [], orders_by_status: [], top_products: [], revenue_by_store: [] },
      });
    }

    /* Summary stats */
    const revenueResult = await query(
      `SELECT
         COUNT(DISTINCT o.id)          AS total_orders,
         COALESCE(SUM(oi.subtotal), 0) AS total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.store_id = ANY($1)
         AND o.status != 'cancelled'`,
      [storeIds]
    );

    const totalFollowers = stores.reduce(function(s, st) { return s + (st.follower_count || 0); }, 0);
    const totalProducts  = stores.reduce(function(s, st) { return s + (st.product_count  || 0); }, 0);

    /* Daily revenue — last 30 days */
    const dailyResult = await query(
      `SELECT
         DATE(o.created_at)            AS day,
         COALESCE(SUM(oi.subtotal), 0) AS revenue,
         COUNT(DISTINCT o.id)          AS orders
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.store_id = ANY($1)
         AND o.status != 'cancelled'
         AND o.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(o.created_at)
       ORDER BY day ASC`,
      [storeIds]
    );

    /* Fill missing days with 0 */
    var dailyMap = {};
    dailyResult.rows.forEach(function(row) {
      dailyMap[row.day.toISOString().split("T")[0]] = {
        revenue: Number(row.revenue),
        orders:  Number(row.orders),
      };
    });

    var daily_revenue = [];
    for (var i = 29; i >= 0; i--) {
      var d   = new Date();
      d.setDate(d.getDate() - i);
      var key = d.toISOString().split("T")[0];
      var mon = d.toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
      daily_revenue.push({
        date:    key,
        label:   mon,
        revenue: dailyMap[key] ? dailyMap[key].revenue : 0,
        orders:  dailyMap[key] ? dailyMap[key].orders  : 0,
      });
    }

    /* Weekly revenue — last 12 weeks */
    const weeklyResult = await query(
      `SELECT
         DATE_TRUNC('week', o.created_at) AS week,
         COALESCE(SUM(oi.subtotal), 0)    AS revenue,
         COUNT(DISTINCT o.id)             AS orders
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.store_id = ANY($1)
         AND o.status != 'cancelled'
         AND o.created_at >= NOW() - INTERVAL '12 weeks'
       GROUP BY DATE_TRUNC('week', o.created_at)
       ORDER BY week ASC`,
      [storeIds]
    );

    var weekly_revenue = weeklyResult.rows.map(function(row) {
      return {
        label:   "W/e " + new Date(row.week).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }),
        revenue: Number(row.revenue),
        orders:  Number(row.orders),
      };
    });

    /* Orders by status */
    const statusResult = await query(
      `SELECT o.status, COUNT(*) AS count
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.store_id = ANY($1)
       GROUP BY o.status`,
      [storeIds]
    );

    var orders_by_status = statusResult.rows.map(function(row) {
      return { status: row.status, count: Number(row.count) };
    });

    /* Top 5 products by revenue */
    const topProductsResult = await query(
      `SELECT
         oi.product_id,
         oi.product_name,
         SUM(oi.subtotal)   AS revenue,
         SUM(oi.quantity)   AS units_sold,
         AVG(oi.unit_price) AS avg_price
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.store_id = ANY($1)
         AND o.status != 'cancelled'
       GROUP BY oi.product_id, oi.product_name
       ORDER BY revenue DESC
       LIMIT 5`,
      [storeIds]
    );

    var top_products = topProductsResult.rows.map(function(row) {
      return {
        product_id:   row.product_id,
        product_name: row.product_name,
        revenue:      Number(row.revenue),
        units_sold:   Number(row.units_sold),
        avg_price:    Number(row.avg_price),
      };
    });

    /* Revenue by store */
    const revenueByStoreResult = await query(
      `SELECT
         oi.store_id,
         s.name           AS store_name,
         s.logo_url,
         SUM(oi.subtotal) AS revenue,
         COUNT(DISTINCT o.id) AS orders
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN stores s ON oi.store_id = s.id
       WHERE oi.store_id = ANY($1)
         AND o.status != 'cancelled'
       GROUP BY oi.store_id, s.name, s.logo_url
       ORDER BY revenue DESC`,
      [storeIds]
    );

    var revenue_by_store = revenueByStoreResult.rows.map(function(row) {
      return {
        store_id:   row.store_id,
        store_name: row.store_name,
        logo_url:   row.logo_url,
        revenue:    Number(row.revenue),
        orders:     Number(row.orders),
      };
    });

    /* This week vs last week */
    const comparisonResult = await query(
      `SELECT
         SUM(CASE WHEN o.created_at >= DATE_TRUNC('week', NOW()) THEN oi.subtotal ELSE 0 END) AS this_week,
         SUM(CASE WHEN o.created_at >= DATE_TRUNC('week', NOW()) - INTERVAL '1 week'
                   AND o.created_at <  DATE_TRUNC('week', NOW()) THEN oi.subtotal ELSE 0 END) AS last_week,
         COUNT(CASE WHEN o.created_at >= DATE_TRUNC('week', NOW()) THEN 1 END) AS orders_this_week,
         COUNT(CASE WHEN o.created_at >= DATE_TRUNC('week', NOW()) - INTERVAL '1 week'
                    AND o.created_at <  DATE_TRUNC('week', NOW()) THEN 1 END) AS orders_last_week
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.store_id = ANY($1)
         AND o.status != 'cancelled'`,
      [storeIds]
    );

    var cmp       = comparisonResult.rows[0];
    var thisWeek  = Number(cmp && cmp.this_week  ? cmp.this_week  : 0);
    var lastWeek  = Number(cmp && cmp.last_week  ? cmp.last_week  : 0);
    var growth    = lastWeek > 0
      ? (((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1)
      : thisWeek > 0 ? "100" : "0";

    var summary = {
      total_revenue:     Number(revenueResult.rows[0] ? revenueResult.rows[0].total_revenue : 0),
      total_orders:      Number(revenueResult.rows[0] ? revenueResult.rows[0].total_orders  : 0),
      total_products:    totalProducts,
      total_followers:   totalFollowers,
      this_week_revenue: thisWeek,
      last_week_revenue: lastWeek,
      revenue_growth:    growth,
      orders_this_week:  Number(cmp && cmp.orders_this_week ? cmp.orders_this_week : 0),
      orders_last_week:  Number(cmp && cmp.orders_last_week ? cmp.orders_last_week : 0),
    };

    res.status(200).json({
      success: true,
      stores,
      summary,
      charts: {
        daily_revenue,
        weekly_revenue,
        orders_by_status,
        top_products,
        revenue_by_store,
      },
    });

  } catch (err) {
    console.error("Analytics error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load analytics." });
  }
};

module.exports = { getVendorAnalytics };
