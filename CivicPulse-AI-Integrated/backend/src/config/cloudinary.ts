import cloudinary from "../integrations/cloudinary/cloudinary.client";

export const verifyCloudinaryConnection= async(): Promise<boolean>=>{
    try{
        const result= await cloudinary.api.ping();
        return result.status=== "ok";
    }catch(error){
        console.error("cloudinary connection failed", error);
        return false;
    }
};

export default cloudinary;