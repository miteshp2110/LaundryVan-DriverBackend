const { pool } = require("../../config/db");

const getAssignedOrders = async (req, res) => {
  try {
    const driverId = req.driver.id;

    // Get orders with concatenated item information
    const [orders] = await pool.query(
      `SELECT 
        o.id,
        o.pickup_time,
        o.pickup_date,
        o.delivery_time,
        o.delivery_date,
        o.order_total,
        o.payment_mode,
        o.payment_status,
        o.order_status,
        a.addressName,
        a.area,
        a.buildingNumber,
        a.landmark,
        a.latitude,
        a.longitude,
        u.fullName as customerName,
        u.phone as customerPhone,
        osn.statusName as currentStatus,
        GROUP_CONCAT(
          CONCAT(s.name, '|', i.name, '|', oi.quantity, '|', oi.item_price) 
          ORDER BY s.name, i.name 
          SEPARATOR ';'
        ) as items_data
      FROM orders o
      JOIN addresses a ON o.address = a.id
      JOIN users u ON o.user_id = u.id
      JOIN order_status_names osn ON o.order_status = osn.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN items i ON oi.item_id = i.id
      LEFT JOIN category c ON i.category_id = c.id
      LEFT JOIN services s ON c.service_id = s.id
      WHERE o.van_id = ? 
        AND o.order_status IN (1, 2, 3)
      GROUP BY o.id
      ORDER BY o.pickup_date ASC, o.pickup_time ASC`,
      [driverId]
    );

    // Transform the result to group products by service
    // @ts-ignore
    const transformedOrders = orders.map((order) => {
      const serviceMap = new Map();

      if (order.items_data) {
        const items = order.items_data.split(";");
        items.forEach((item) => {
          const [service, product, quantity, price] = item.split("|");
          if (service && product && quantity) {
            if (!serviceMap.has(service)) {
              serviceMap.set(service, {
                service: service,
                productList: [],
              });
            }
            serviceMap.get(service).productList.push({
              product: product,
              quantity: parseInt(quantity),
              price: parseFloat(price),
            });
          }
        });
      }

      // Remove the raw items_data and add the grouped services
      const { items_data: _, ...orderWithoutItemsData } = order;
      return {
        ...orderWithoutItemsData,
        services: Array.from(serviceMap.values()),
      };
    });

    res.json(transformedOrders);
  } catch (err) {
    console.error("Error fetching assigned orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { orderId, status } = req.body;
    const driverId = req.driver.id;

    await connection.beginTransaction();

    // Validate status
    if (!Number.isInteger(status) || status < 1 || status > 4) {
      throw new Error("Invalid status. Must be between 1 and 4");
    }

    // Get current order details
    const [order] = await connection.query(
      "SELECT id, order_status FROM orders WHERE id = ? AND van_id = ?",
      [orderId, driverId]
    );

    // @ts-ignore
    if (!order.length) {
      throw new Error("Not authorized to update this order");
    }

    const currentStatus = order[0].order_status;

    // Validate forward-only status transition
    if (status <= currentStatus) {
      throw new Error("Status can only be updated to a higher value");
    }

    if (status !== currentStatus + 1) {
      throw new Error("Status must be updated one step at a time");
    }

    // Update orders table
    await connection.query("UPDATE orders SET order_status = ? WHERE id = ?", [
      status,
      orderId,
    ]);

    // Add to order status history
    await connection.query(
      "INSERT INTO order_status_history (order_id, order_status) VALUES (?, ?)",
      [orderId, status]
    );

    // Update logistics_ledger based on status
    if (status === 2) {
      // Picked Up
      await connection.query(
        `INSERT INTO logistics_ledger (order_id, pickedUp_at, pickedUp_by) 
         VALUES (?, NOW(), ?)
         ON DUPLICATE KEY UPDATE pickedUp_at = NOW(), pickedUp_by = ?`,
        [orderId, driverId, driverId]
      );
    } else if (status === 4) {
      // Delivered
      await connection.query(
        `UPDATE logistics_ledger 
         SET delivered_at = NOW(), delivered_by = ? 
         WHERE order_id = ?`,
        [driverId, orderId]
      );
    }

    await connection.commit();
    res.json({ message: "Order status updated successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(err.message.includes("Not authorized") ? 403 : 400).json({
      error: err.message || "Internal server error",
    });
  } finally {
    connection.release();
  }
};

const getVanDetails = async (req, res) => {
  try {
    const driverId = req.driver.id;

    const [vanDetails] = await pool.query(
      `SELECT v.van_number, v.phone, r.name as region_name,
              r.latitude, r.longitude
       FROM vans v
       JOIN regions r ON v.region_id = r.id
       WHERE v.id = ?`,
      [driverId]
    );

    // @ts-ignore
    if (!vanDetails.length) {
      return res.status(404).json({ error: "Van not found" });
    }

    res.json(vanDetails[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.body;
    const driverId = req.driver.id;

    // Verify order belongs to this driver and is cash payment
    const [order] = await pool.query(
      "SELECT id, payment_mode, payment_status FROM orders WHERE id = ? AND van_id = ? AND payment_mode = 'cash'",
      [orderId, driverId]
    );

    // @ts-ignore
    if (!order.length) {
      return res.status(403).json({
        error: "Not authorized or not a cash payment order",
      });
    }

    // Update payment status to true (paid)
    await pool.query("UPDATE orders SET payment_status = true WHERE id = ?", [
      orderId,
    ]);

    res.json({ message: "Payment status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addOrderItems = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { orderId, productList } = req.body;
    const driverId = req.driver.id;

    console.log("Adding items:", { orderId, productList, driverId });

    if (
      !productList ||
      !Array.isArray(productList) ||
      productList.length === 0
    ) {
      throw new Error("Product list cannot be empty");
    }

    await connection.beginTransaction();

    // Verify order belongs to this driver and is not completed
    const [order] = await connection.query(
      "SELECT id FROM orders WHERE id = ? AND van_id = ? AND order_status < 4",
      [orderId, driverId]
    );

    console.log("Order check result:", order);

    // @ts-ignore
    if (!order.length) {
      throw new Error("Not authorized or order already completed");
    }

    // Get current prices for all products
    const productIds = productList.map((item) => item.productId);
    console.log("Product IDs:", productIds);

    const query = "SELECT id, price FROM items WHERE id IN (?)";
    const [prices] = await connection.query(query, [productIds]);

    console.log("Prices result:", prices);

    // @ts-ignore
    if (!prices || prices.length === 0) {
      throw new Error("No valid products found");
    }

    // @ts-ignore
    if (prices.length !== productIds.length) {
      throw new Error("Some product IDs are invalid");
    }

    // @ts-ignore
    const priceMap = new Map(prices.map((item) => [item.id, item.price]));

    // Calculate and validate items
    let totalAddition = 0;
    const itemsToInsert = productList.map((item) => {
      if (!priceMap.has(item.productId)) {
        throw new Error(`Invalid product ID: ${item.productId}`);
      }
      const itemPrice = priceMap.get(item.productId);
      totalAddition += itemPrice * item.quantity;
      return [orderId, item.productId, item.quantity, itemPrice];
    });

    // Insert new items
    await connection.query(
      "INSERT INTO order_items (order_id, item_id, quantity, item_price) VALUES ?",
      [itemsToInsert]
    );

    // Update order total
    await connection.query(
      "UPDATE orders SET order_total = order_total + ? WHERE id = ?",
      [totalAddition, orderId]
    );

    await connection.commit();
    res.json({
      message: "Items added successfully",
      addedAmount: totalAddition,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error adding order items:", err.message, err.stack);
    res.status(err.message.includes("Not authorized") ? 403 : 400).json({
      error: err.message || "Internal server error",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAssignedOrders,
  updateOrderStatus,
  getVanDetails,
  updatePaymentStatus,
  addOrderItems,
};
