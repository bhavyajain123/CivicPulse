import type {ServerOptions} from "socket.io";
import { corsOptions } from "./cors";

const socketConfig: Partial<ServerOptions>={
    cors: corsOptions,
    transports:["websocket","polling"],
};

export default socketConfig;