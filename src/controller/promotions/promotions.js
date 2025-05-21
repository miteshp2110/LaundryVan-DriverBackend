const { pool } = require("../../config/db")


const getPromotions = async(req,res)=>{
    try{
        const {limit=null} = req.query || {}
        var query = "Select id,title,description,coupon_code,promotionImageUrl from promotions where is_active = 1 and CURDATE() between valid_from and valid_to"
        if(limit){
            query += ` LIMIT ${limit}`
        } 
    
        const [result] = await pool.query(query)
        if(result.length === 0){
            return res.status(404).json({message: "No promotions found"})
        }
        return res.status(200).json(result)
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: "Internal server error"});
    }
}

const isPromotionApplicable = async(req,res)=>{
    try{
       const {promotionId=null,orderTotal} = req.body || {}

       if(!promotionId || !orderTotal){
            return res.status(400).json({error: "Promotion id and order total are required"})
        }
        const query = "select * from promotions where id = ? and is_active = 1 and CURDATE() between valid_from and valid_to"
        const [result] = await pool.query(query,[promotionId])
    
        if(result.length === 0){
            return res.status(404).json({error: "Promotion not found"})
        }
        const promotion = result[0]
        if(orderTotal < promotion.threshHold){
            return res.status(400).json({error: "Order total is less than minimum order value"})
        }
        var newPrice = 0
        if(promotion.discount_percentage){
            newPrice = orderTotal - (orderTotal * (promotion.discount_percentage / 100))
        }
        else if(promotion.fixed_discount){
            newPrice = orderTotal - promotion.fixed_discount
        }
        newPrice = Math.floor(newPrice)+1
        return res.status(200).json({message: "Promotion is applicable",discountedPrice: newPrice})
    }
    catch(err){
        console.error(err);
        res.status(500).json({error: "Internal server error"});
    }
}


module.exports = {getPromotions,isPromotionApplicable}


