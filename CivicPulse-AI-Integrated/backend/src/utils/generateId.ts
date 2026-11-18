import crypto from "crypto";

export const generateId= (length: number=12): string=>{
    if(!Number.isInteger(length) || length<1 || length>128){
        throw new Error("id length must be between 1 and 128");
    }
    return crypto.randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}
 export default generateId;