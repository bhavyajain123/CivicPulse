import type {Server} from "socket.io";
export interface NotificationPayload{
    title:string;
    message:string;
    type:string;
    incidentId?:string;
}
export const emitNotification=(
    io:Server,
    userId:string,
    notification:NotificationPayload
):void=>{
    io.to(`user-${userId}`).emit(
        "new-notification",
        notification
    );
};