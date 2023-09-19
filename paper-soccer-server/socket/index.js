import { createServer } from "http"
import { Server } from "socket.io"
import expressApp from "../rest/index.js"
import { query } from "../prisma/client.js"

const server = createServer(expressApp)
const port = process.env.SERVER_PORT || 8080

const io = new Server(server, {
    cors: {
        origin: [`${process.env.CLIENT_ADDRESS}:${process.env.CLIENT_PORT}`]
    }
})

export function setupSocketIO() {
    server.listen(port, () => {
        console.log(`Listening on port ${port}`);
    })

    // Attach event listeners to server and sockets
    io.on("connection", (socket) => {
        var room = socket.handshake['query']['room'];
        console.log("connected", room, socket.id)


        socket.on("disconnect", () => {
            console.log("disconnected");
        })
    })
}

export default io