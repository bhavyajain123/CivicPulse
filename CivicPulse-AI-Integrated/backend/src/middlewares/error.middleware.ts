import {Request, Response, NextFunction} from "express";
import { ZodError } from "zod";
import ApiError  from "../utils/ApiError";

const errorMiddleware=(
    error:unknown,
    req:Request,
    res:Response,
    next:NextFunction
): void=>{
    if(res.headersSent){
        return next(error);
    }
    if(error instanceof ZodError){
        res.status(400).json({
            success:false,
            message:"validation failed",
            error:error.issues.map((issue)=>({
                field:issue.path.join("."),
                message:issue.message
            }))
        });
        return;
    }
    if(error instanceof ApiError){
        res.status(error.statusCode).json({
            success:false,
            message:error.message
        });
        return;
    }
    console.error("unexpected error:", error);

    const isDevelopment= process.env.NODE_ENV ==="development";

    res.status(500).json({
        success:false,
        message:"internal server error",
        ...(isDevelopment && {
            error: error instanceof Error ? error.message: "unknown error"

        })
    });
};
export default errorMiddleware;