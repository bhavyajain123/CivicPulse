import jwt from "jsonwebtoken";

interface TokenPayload{
    userId:string;
    role:string;
}
export const generateToken=(
    payload: TokenPayload
):string=>{
    const secret= process.env.JWT_SECRET;

    if(!secret){
        throw new Error("jwt secret is missing");

    }
    return jwt.sign(payload, secret,{
        expiresIn:"15m",
    });
};

export default generateToken;