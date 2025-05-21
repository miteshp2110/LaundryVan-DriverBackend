const { pool } = require("../../config/db")
const { groupItemsByCategory, groupByService } = require("../../utils/grouping")

const getServices = async(req,res)=>{
    try{
        const {limit=null} = req.query || {}
        var query = "Select * from services"
        if(limit){
            query += ` LIMIT ${limit}`
        } 
    
        const [result] = await pool.query(query)
        if(result.length === 0){
            return res.status(404).json({message: "No services found"})
        }
        return res.status(200).json(result)
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: "Internal server error"});
    }
}

const getServiceDetails = async(req,res)=>{
    try{
        const {id=null} = req.query || {}
        if(!id){
            return res.status(400).json({error: "Service id is required"})
        }
        const query = "select category.id as cId, category.name as category, items.id as itemId, items.name as item , items.price as price , items.iconUrl as iconUrl from category join items on items.category_id = category.id where service_id = ?"
        const [result] = await pool.query(query,[id])
    
        if(result.length === 0){
            return res.status(404).json({message: "Service not found"})
        }
        return res.status(200).json(groupItemsByCategory(result))
    }
    catch(err){
        console.error(err);
        res.status(500).json({error: "Internal server error"});
    }
}

const searchServices = async(req,res)=>{
    try{
        const {name} = req.query || {}
        if(!name){
            return res.status(400).json({error: "Name is required"})
        }
        const query = "Select * from services where name like ? limit 5"
        const [result] = await pool.query(query,[`%${name}%`])
    
        if(result.length === 0){
            return res.status(404).json({message: "No services found"})
        }
        return res.status(200).json(result)
    }
    catch(err){
        console.error(err);
        res.status(500).json({error: "Internal server error"});
    }
}

const mobileServiceAll = async(req,res)=>{
    try{

        const [result] = await pool.query("SELECT s.id AS sId, s.name AS service, s.iconUrlBig AS largeIcon, s.iconUrlSmall AS smallIcon, c.name AS category,c.id as categoryId, i.id AS productId, i.name AS product, i.price AS price, i.iconUrl AS productUrl FROM services AS s INNER JOIN category AS c ON c.service_id = s.id INNER JOIN items AS i ON i.category_id = c.id")

        return res.status(200).json(groupByService(result))
    }
    catch(err){
        console.error(err);
        res.status(500).json({error: "Internal server error"});
    }

}


module.exports = {getServices,getServiceDetails,searchServices,mobileServiceAll}