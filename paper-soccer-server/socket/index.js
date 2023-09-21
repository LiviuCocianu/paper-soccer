import { createServer } from "http"
import { Server } from "socket.io"
import expressApp from "../rest/index.js"
import { query } from "../prisma/client.js"
import { SOCKET_EVENT } from "../constants.js"

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
        const { room, username="Player" } = socket.handshake.query

        query(async (prisma) => {
            const playerCount = await prisma.player.count({
                where: { invitedTo: room }
            })

            if(playerCount == 2) {
                socket.emit(SOCKET_EVENT.PLAYER_ERROR, { message: "Encountered a problem while joining: this room is full!" })
                socket.disconnect()
                return
            }

            const player = await prisma.player.create({
                data: {
                    id: socket.id,
                    invitedTo: room,
                    username,
                }
            })

            if(!player) {
                socket.emit(SOCKET_EVENT.PLAYER_ERROR, { message: "Encountered a problem while joining: couldn't add player" })
                socket.disconnect()
                return
            }
            
            socket.join(room)
            
            console.log("");
            console.log(`Player (NAME=${username}, ID=${socket.id}) joined a room (INVITE=${room})`);
        }, (e) => console.log(e))

        socket.on("disconnect", () => {
            query(async (prisma) => {
                const player = await prisma.player.delete({
                    where: { id: socket.id }
                })

                if(!player) return

                console.log("");
                console.log(`Player (NAME=${player.username}, ID=${player.id}) disconnected from room (INVITE=${player.invitedTo})`);
            
                const playerCount = await prisma.player.count({
                    where: { invitedTo: room }
                })

                if(playerCount == 0) {
                    const deleted = await prisma.room.delete({
                        where: { inviteCode: room }
                    })

                    if (!deleted) return

                    console.log(`Room (INVITE=${deleted.inviteCode}) was deleted: no players left, room went unused`);
                }
            })
        })
    })
}

export default io