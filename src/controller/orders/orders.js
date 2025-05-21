const { pool } = require("../../config/db")
const { groupOrders } = require("../../utils/grouping")

const insertOrderQuery = "Insert into orders (user_id, address,pickup_date,pickup_time,delivery_time,delivery_date,promotion_id,payment_mode,payment_status,order_total,order_status,van_id) values ((select id from users where email = ?),?,?,?,?,?,?,?,?,?,1,(select id from vans where region_id = (select region_id from addresses where id = ?) limit 1))"


const addOrder = async (req, res) => {
    const conn = await pool.getConnection()
    const {productList=null, addressId=null, pickUpDate=null,pickUpTime=null,deliveryTime=null,deliveryDate=null, paymentStatus=null,orderTotal = null,promotionId} = req.body || {}
    var {paymentMode = null} = req.body || {}
        if(!productList || !addressId || !pickUpDate || !pickUpTime || !deliveryTime || !deliveryDate || !paymentMode || paymentStatus==null || !orderTotal){
            return res.status(400).json({error: "Invalid body"})
        }
        var promotion_id = promotionId==-1 ? null : promotionId
        
        paymentMode = paymentMode.toLowerCase()
        
        const {email} = req.user 
    
    try{

        if((paymentMode ==="online" && paymentStatus === false) || (paymentMode === "cash" && paymentStatus === true)){
            return res.status(400).json({error: "Invalid payment state"})
        }

        await conn.beginTransaction()


        const [orderId] = await conn.query(insertOrderQuery,[email,addressId,pickUpDate,pickUpTime,deliveryTime,deliveryDate,promotion_id,paymentMode,paymentStatus,orderTotal,addressId])

        var itemsInsertQuery = "Insert into order_items (order_id,item_id,quantity) values  "

        productList.forEach((item) => {
            const newItemInsert = `(${orderId.insertId},${item.productId},${item.quantity}),`
            itemsInsertQuery += newItemInsert
        })
        itemsInsertQuery = itemsInsertQuery.slice(0, -1)

        await conn.query(itemsInsertQuery)
    
        await conn.query("Insert into order_status_history (order_id,order_status) values (?,1)",[orderId.insertId])

        await conn.commit()

        return res.status(200).json({message: "Order created successfully"})
    }
    catch(err){
        

        if(paymentMode === "online" && paymentStatus === true){
            await pool.query("insert into failed_orders (user_id,order_total) values ((select id from users where email = ?),?)",[email,orderTotal])
        }
        await conn.rollback()
        console.error(err);
        res.status(500).json({error: "Internal server error"});
    }
    finally{
        conn.release()
    }
} 


const getPreviousOrders = async (req,res)=>{
    try{
        const {email} = req.user
        const [result] = await pool.query("SELECT o.id AS oId, a.addressType AS address, o.pickup_time, o.pickup_date, o.delivery_time, o.delivery_date, o.payment_status, o.payment_mode,o.order_total, o.order_status AS currentStatus, i.name AS product,i.price as price, oi.quantity AS quantity, s.name AS service FROM orders AS o JOIN addresses AS a ON a.id = o.address JOIN order_items AS oi ON oi.order_id = o.id JOIN items AS i ON i.id = oi.item_id JOIN category AS c ON c.id = i.category_id JOIN services AS s ON s.id = c.service_id WHERE o.id in (select id from orders where user_id in (select id from users where email = ?))",[email])

        const [statusHistory] = await pool.query("select * from order_status_history where order_id in (select id from orders where user_id = (select id from users where email = ?))",[email])

        return res.status(200).json(groupOrders(result,statusHistory))
        
    }
    catch(err){
        console.error(err);
        res.status(500).json({error: "Internal server error"});
    }
}

module.exports = { addOrder,getPreviousOrders}