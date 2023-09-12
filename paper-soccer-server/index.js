import "dotenv/config"
import { createServer } from "http"
import { Server } from "socket.io"

const httpServer = createServer()
const io = new Server(httpServer, {
    cors: {
        origin: [`http://localhost:${process.env.SERVER_PORT}`]
    }
})

const roomsNamespace = io.of("/game/^[a-zA-Z0-9]{8}$")

roomsNamespace.on("connection", (socket) => {
    console.log("conencted")
})

httpServer.listen(process.env.SERVER_PORT)