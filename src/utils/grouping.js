function groupItemsByCategory(data) {
    const grouped = {};
  
    data.forEach(item => {
      const category = item.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({
        itemId: item.itemId,
        item: item.item,
        price: item.price,
        iconUrl: item.iconUrl
      });
    });
  
    return grouped;
  }

/**
 * @param {Array<Object>} items            Flat list of order-line items
 * @param {Array<Object>} statusHistory    List of { id, order_id, order_status, createdAt }
 * @returns {Array<Object>} grouped orders
 */
function groupOrders(items, statusHistory) {
  const ordersMap = items.reduce((acc, line) => {
    const {
      oId,
      service,
      product,
      quantity,
      address,
      pickup_time,
      pickup_date,
      delivery_time,
      delivery_date,
      payment_status,
      payment_mode,
      order_total,
      currentStatus
    } = line;

    // Initialize order bucket
    if (!acc[oId]) {
      acc[oId] = {
        oId,
        address,
        pickup_time,
        pickup_date,
        delivery_time,
        delivery_date,
        payment_status,
        payment_mode,
        order_total,
        currentStatus,
        services: []
      };
    }

    // Group lines into services
    const order = acc[oId];
    let svc = order.services.find(s => s.service === service);
    if (!svc) {
      svc = { service, productList: [] };
      order.services.push(svc);
    }
    svc.productList.push({ product, quantity });

    return acc;
  }, {});

  // Build final array, attach statusHistory + bags count
  return Object.values(ordersMap).map(order => {
    const history = statusHistory
      .filter(s => s.order_id === order.oId)
      // @ts-ignore
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(s => {
        const dt = new Date(s.createdAt);
        return {
          status: s.order_status,
          date: dt.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }),       
          time: dt.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })        
        };
      });

    return {
      ...order,
      bags: order.services.length,
      statusHistory: history
    };
  });
}

/**
 * @param {Array<Object>} data
 * @returns {Array<Object>}
 *
 * Output shape:
 * [
 *   {
 *     sId,
 *     Service,
 *     largeIcon,
 *     smallIcon,
 *     categories: [
 *       {
 *         Category,
 *         items: [
 *           { itemId, Item, price, itemUrl },
 *           …
 *         ]
 *       },
 *       …
 *     ]
 *   },
 *   …
 * ]
 */
function groupByService(data) {
  const serviceMap = data.reduce((acc, entry) => {
    const {
      sId,
      service,
      largeIcon,
      smallIcon,
      category,
      categoryId,
      productId,
      product,
      price,
      productUrl
    } = entry;

    // 1) Get or create the service bucket
    if (!acc[sId]) {
      acc[sId] = {
        sId,
        service,
        largeIcon,
        smallIcon,
        categories: []
      };
    }
    const serviceBucket = acc[sId];

    // 2) Get or create the category bucket under this service
    let catBucket = serviceBucket.categories.find(cat => cat.category === category);
    if (!catBucket) {
      catBucket = {
        category,
        categoryId,
        products: []
      };
      serviceBucket.categories.push(catBucket);
    }

    // 3) Push the item
    catBucket.products.push({ productId, product, price, productUrl });

    return acc;
  }, {});

  // 4) Return the array of services
  return Object.values(serviceMap);
}




  
  module.exports = { groupItemsByCategory ,groupOrders,groupByService};