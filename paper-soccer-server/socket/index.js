import app from "../rest/index.js"
import { query } from "../prisma/client.js"

import { createServer } from "http"
import { Server } from "socket.io"

import { onDisconnect, onNodeClicked } from "./listeners.js"
import { GamestateEmitter, PlayerEmitter } from "./emitters.js"
import { GAME_STATUS } from "../constants.js"

const server = createServer(app)
const port = process.env.SERVER_PORT || 8080

server.listen(port, () => {
    console.log("");
    console.log("  Paper Soccer server is up and ready! Welcome! 😊");
    console.log(`  (( listening on port ${port} ))`);
    console.log("");
})

const io = new Server(server, {
    cors: {
        origin: [`${process.env.CLIENT_ADDRESS}:${process.env.CLIENT_PORT}`]
    }
})

export default io

// Wipe the previous data from the database as we don't need to persist it across server restarts
query(async (prisma) => {
    const dataCount = await prisma.room.count()
    
    if(dataCount > 0) {
        /*
            The database is structured like a tree, where the Room table sits at the very top,
            so deleting all the rooms will cascade to all the other remaining tables
        */
        await prisma.room.deleteMany({})
        console.log("Wiped previous data from database!")
    }
}, () => console.warn("Couldn't connect to database!"))

// Attach event listeners to sockets
io.on("connection", (socket) => {
    // Setup connection
    let { room: inviteCode, username = "Player" } = socket.handshake.query

    if(!inviteCode || inviteCode.length != 8) {
        socket.disconnect()
        return
    }
    
    username = username.slice(0, 16)

    query(async (prisma) => {
        const playerCount = await prisma.player.count({
            where: { invitedTo: inviteCode }
        })

        if (playerCount == 2) {
            PlayerEmitter.emitError(socket, "Encountered a problem while joining: this room is full!")
            return
        }

        const room = await prisma.room.findFirst({
            where: { inviteCode },
            include: { gamestate: true }
        })

        if (room != null && room.gamestate.status != GAME_STATUS.WAITING) {
            PlayerEmitter.emitError(socket, "Encountered a problem while joining: this room is locked!")
            return
        }

        const player = await prisma.player.create({
            data: {
                id: socket.id,
                invitedTo: inviteCode,
                username: username.length == 0 ? `Player ${playerCount + 1}` : username,
                roomOrder: playerCount + 1
            }
        })

        if (!player) {
            PlayerEmitter.emitError(socket, "Encountered a problem while joining: couldn't add player")
            return
        }

        socket.join(inviteCode)

        console.log("");
        console.log(`Player (NAME=${player.username}, ID=${socket.id}) joined a room (INVITE=${player.invitedTo}, MODE=${room.gamestate.mode})`);

        PlayerEmitter.emitRoomOrder(socket, player.roomOrder)

        // Tell the client to update the scoreboard
        const players = await prisma.player.findMany({
            where: { invitedTo: inviteCode }
        })

        if(players.length > 0) {
            players.forEach(pl => {
                PlayerEmitter.emitNameUpdated(inviteCode, pl.roomOrder, pl.username)
            })
        }

        // Start the game if room got full
        if(playerCount == 1) {
            const statusUpdated = await prisma.room.update({
                where: { inviteCode },
                data: {
                    gamestate: { update: {
                        data: {
                            status: GAME_STATUS.STARTING
                        }
                    }}
                }
            })

            if(!statusUpdated) return

            // Emit status change to client and keep going on acknowledgement
            GamestateEmitter.emitStatusUpdated(inviteCode, GAME_STATUS.STARTING, () => {
                let counter = 5

                console.log("");
                console.log(`Room (INVITE=${inviteCode}, MODE=${room.gamestate.mode}) is about to start a game!`);

                const countdown = setInterval(async () => {
                    const roomWithState = await prisma.room.findUnique({
                        where: { inviteCode },
                        include: { gamestate: true }
                    })

                    // Cancel countdown if status changes while counting
                    if (roomWithState.gamestate.status != GAME_STATUS.STARTING) {
                        clearInterval(countdown)
                        return
                    }

                    if (counter > 1) {
                        // Emit the countdown to the client so it knows what to diplay
                        GamestateEmitter.emitCountdownUpdated(inviteCode, counter - 1, () => {
                            counter -= 1
                        })
                    } else {
                        clearInterval(countdown)

                        const statusUpdated = await prisma.gamestate.update({
                            where: { roomId: roomWithState.id },
                            data: { status: GAME_STATUS.ONGOING }
                        })

                        const ballNode = await prisma.pitchnode.create({
                            data: { stateId: roomWithState.gamestate.id, point: roomWithState.gamestate.ballPosition }
                        })

                        if (!statusUpdated || !ballNode) return

                        // Tell the client the game started
                        GamestateEmitter.emitStatusUpdated(inviteCode, GAME_STATUS.ONGOING)

                        console.log("");
                        console.log(`Room (INVITE=${inviteCode}, MODE=${room.gamestate.mode}) started the game!`);
                    }
                }, 1000)
            })
        }
    }, (e) => {
        console.log(e)
        socket.disconnect()
    })

    // Socket events
    onDisconnect(socket)
    onNodeClicked(socket)
})