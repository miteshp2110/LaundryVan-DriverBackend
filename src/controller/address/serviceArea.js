const { pool } = require("../../config/db")

function getDistance(lat_a, lon_a, lat_b, lon_b) {
    // Convert latitude and longitude from degrees to radians
    const radLatA = (Math.PI / 180) * lat_a;
    const radLonA = (Math.PI / 180) * lon_a;
    const radLatB = (Math.PI / 180) * lat_b;
    const radLonB = (Math.PI / 180) * lon_b;
  
    // Calculate the difference in radians
    const deltaLat = radLatB - radLatA;
    const deltaLon = radLonB - radLonA;
  
    // Apply the Haversine formula
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(radLatA) *
      Math.cos(radLatB) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    // Radius of the Earth in kilometers (approximately)
    const R = 6371;
  
    // Calculate the distance
    const distance = R * c;
  
    return distance;
  }

const checkServiceArea = async(req,res)=>{

    try{
        const {lat=null,lon=null} = req.body || {}
        if(!lat || !lon){
            return res.status(400).json({error:"Invalid Body"})
        }
        const latitude = parseFloat(lat)
        const longitude = parseFloat(lon)
        var min = 9999
        var nearestRegion = -1
        const [result] = await pool.query("SELECT id,latitude,longitude,thresholdDistance from regions")
        result.forEach(region => {
            const region_Lat = parseFloat(region.latitude)
            const region_Lon = parseFloat(region.longitude)
            const distance = getDistance(latitude,longitude,region_Lat,region_Lon)
            if(distance <= region.thresholdDistance){
                if(distance < min){
                    min = distance
                    nearestRegion = region.id
                }
            }
        });

        if(nearestRegion === -1){
            return res.status(400).json({error:"Region not yet under service"})
        }
        else{
            return res.status(200).json({message:"Region Available",regionId : nearestRegion})
        }

    }
    catch(e){
        console.error(e)
        return res.status(500).json({error:"Internal Server Error"})
    }
}

module.exports = {checkServiceArea}