import "dotenv/config"
import { createServer } from "http"
import { Server } from "socket.io"

// Setup database
import connection from "./database/index.js"

// Setup web socket server
const httpServer = createServer()
const io = new Server(httpServer, {
    cors: {
        origin: [`${process.env.CLIENT_ADDRESS}:${process.env.CLIENT_PORT}`]
    }
})

httpServer.listen(process.env.SERVER_PORT)

// Attach event listeners to server and sockets
io.on("connection", (socket) => {
    var room = socket.handshake['query']['room'];
    console.log("connected", room)

    socket.on("disconnect", () => {
        console.log("disconnected");
    })
})
