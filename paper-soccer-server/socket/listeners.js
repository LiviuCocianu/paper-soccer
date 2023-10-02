import { Socket } from "socket.io";
import { GAME_MODE, GAME_STATUS, SOCKET_EVENT } from "../constants.js";
import { canMove, findNodeByPoint, getGoalpostAtBall, isGoalpostBlocked, isValidMove } from "../game/utils.js";
import { query } from "../prisma/client.js";
import { GamestateEmitter, PlayerEmitter } from "./emitters.js";
import { PitchNode } from "../factory.js";

/**
 * @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket 
 */
export function onDisconnect(socket) {
    socket.on("disconnect", () => {
        query(async (prisma) => {
            const playerExists = await prisma.player.count({
                where: { id: socket.id }
            })

            if(playerExists == 0) return

            const player = await prisma.player.delete({
                where: { id: socket.id }
            })

            const room = await prisma.room.findFirst({
                where: { inviteCode: player.invitedTo },
                include: { gamestate: true }
            })

            if (!player) return

            console.log("");
            console.log(`Player (NAME=${player.username}, ID=${player.id}) disconnected from room (INVITE=${player.invitedTo}, MODE=${room.gamestate.mode})`);

            const playerCount = await prisma.player.count({
                where: { invitedTo: player.invitedTo }
            })

            // Cancel game on player disconnect
            // The room will remain active until all sockets disconnect from it
            if(room.gamestate.status != GAME_STATUS.FINISHED && playerCount == 1) {
                const statusUpdated = await prisma.room.update({
                    where: { inviteCode: player.invitedTo },
                    data: { gamestate: {
                        update: { data: {
                            status: GAME_STATUS.SUSPENDED
                        } }
                    } }
                })

                if(!statusUpdated) return

                GamestateEmitter.emitStatusUpdated(player.invitedTo, GAME_STATUS.SUSPENDED)

                console.log(`Room (INVITE=${player.invitedTo}, MODE=${room.gamestate.mode}) was suspended: opponent left the game`);
            }
            // Delete room if all sockets disconnected from it
            else if (playerCount == 0) {
                const deleted = await prisma.room.delete({
                    where: { inviteCode: player.invitedTo }
                })

                if (!deleted) return

                console.log(`Room (INVITE=${deleted.inviteCode}, MODE=${room.gamestate.mode}) was deleted: no players left, room went unused`);
            }
        }, (e) => console.log(e))
    })
}

export function onNodeClicked(socket) {
    /**
     * @param {string} inviteCode Invite code corresponding to the room this node belongs to
     * @param {number} roomOrderNumber Room order number corresponding to the player that clicked
     * @param {PitchNode} node Clicked node object
     */
    const handleNodeClicked = async (inviteCode, roomOrderNumber, node) => {
        query(async (prisma) => {
            const room = await prisma.room.findFirst({
                where: { inviteCode },
                include: { gamestate: { include: { nodes: true } } }
            })

            const isValid = await isValidMove(inviteCode, roomOrderNumber, room.gamestate.ballPosition, node)

            if (!isValid) return

            // Get ball node
            const ballNode = await prisma.pitchnode.findFirst({
                where: { stateId: room.gamestate.id, point: room.gamestate.ballPosition }
            })

            // Create "ball-clicked node" relation
            await prisma.pitchnoderelation.create({
                data: { nodeId: ballNode.id, point: node.point, creator: roomOrderNumber }
            })

            // Make sure clicked node has an entry in the database
            let clickedNode;

            if (room.gamestate.nodes.every(n => n.point != node.point)) {
                clickedNode = await prisma.pitchnode.create({
                    data: { stateId: room.gamestate.id, point: node.point }
                })
            } else {
                clickedNode = await prisma.pitchnode.findFirst({
                    where: { stateId: room.gamestate.id, point: node.point }
                })
            }
            
            // Count the relations for clicked node for calculations, before adding the relation
            const clickedRelationsCount = await prisma.pitchnoderelation.count({
                where: { nodeId: clickedNode.id }
            })

            // Create reciprocal "clicked node-ball" relation
            await prisma.pitchnoderelation.create({
                data: { nodeId: clickedNode.id, point: ballNode.point, creator: roomOrderNumber }
            })
            
            // Calculate game-ending variables
            const bounceable = node.placement == "border" || clickedRelationsCount > 0
            const canMoveBall = await canMove(inviteCode, roomOrderNumber, node.point)
            const inGoalpost = getGoalpostAtBall(node.point)
            const selfGoal = inGoalpost == roomOrderNumber
            const redBlocked = await isGoalpostBlocked(room.gamestate.id)
            const blueBlocked = await isGoalpostBlocked(room.gamestate.id, false)

            // If the active player got the ball stuck or scored a goal in their own goalpost, they lose
            let winner = (!canMoveBall && !inGoalpost) || selfGoal
                ? (roomOrderNumber == 1 ? 2 : 1) 
                : roomOrderNumber

            // Prepare game state columns to update at the end
            let updateData = { ballPosition: node.point }

            if (!bounceable) {
                updateData.activePlayer = roomOrderNumber == 1 ? 2 : 1
                winner = redBlocked ? 1 : (blueBlocked ? 2 : winner)
            }

            if (!canMoveBall || (!bounceable && (redBlocked || blueBlocked))) {
                updateData.status = GAME_STATUS.FINISHED
                GamestateEmitter.emitStatusUpdated(inviteCode, GAME_STATUS.FINISHED)
            }

            if(inGoalpost) {
                const playerScore = await prisma.player.findFirst({
                    where: { invitedTo: inviteCode, roomOrder: winner }
                })

                await prisma.player.update({
                    where: { id: playerScore.id },
                    data: { score: playerScore.score + 1 }
                })

                PlayerEmitter.emitScoreUpdated(inviteCode, winner, playerScore.score + 1)

                switch(room.gamestate.mode) {
                    case GAME_MODE.CLASSIC:
                        updateData.status = GAME_STATUS.FINISHED
                        GamestateEmitter.emitStatusUpdated(inviteCode, GAME_STATUS.FINISHED)

                        console.log("");

                        if (selfGoal) {
                            console.log(`Room (INVITE=${inviteCode}, MODE=${room.gamestate.mode}) was finished: ${roomOrderNumber == 1 ? "red" : "blue"} scored an own goal`);
                        } else {
                            console.log(`Room (INVITE=${inviteCode}, MODE=${room.gamestate.mode}) was finished: ${winner == 1 ? "red" : "blue"} team won`);
                        }
                        break
                    case GAME_MODE.BESTOF3:
                        const players = await prisma.player.findMany({
                            where: { invitedTo: inviteCode }
                        })

                        // Place ball back in the center
                        updateData.ballPosition = 52

                        // Delete nodes and their relations
                        await prisma.pitchnode.deleteMany({
                            where: { stateId: room.gamestate.id }
                        })

                        // Recreate node for the ball
                        await prisma.pitchnode.create({
                            data: { stateId: room.gamestate.id, point: 52 }
                        })

                        const addUpTo3 = players.map(pl => pl.score).reduce((prev, curr) => prev + curr) >= 3
                        const redundantMatch = players.some(pl => pl.score == 2)

                        if(addUpTo3 || redundantMatch) {
                            updateData.status = GAME_STATUS.FINISHED
                            GamestateEmitter.emitStatusUpdated(inviteCode, GAME_STATUS.FINISHED)

                            console.log("");
                        }

                        if (addUpTo3) {
                            console.log(`Room (INVITE=${inviteCode}, MODE=${room.gamestate.mode}) was finished: ${winner == 1 ? "red" : "blue"} team won`);
                        }

                        if (redundantMatch) {
                            const pl = players.find(pl => pl.score == 2)
                            console.log(`Room (INVITE=${inviteCode}, MODE=${room.gamestate.mode}) was finished: ${pl.username} won with a score of 2`);
                        }
                        break
                }
            } else if (!bounceable && (redBlocked || blueBlocked)) {
                console.log("");
                console.log(`Room (INVITE=${inviteCode}, MODE=${room.gamestate.mode}) was finished: ${redBlocked ? "red" : "blue"} goalpost got blocked`);
            } else if (!canMoveBall) {
                console.log("");
                console.log(`Room (INVITE=${inviteCode}, MODE=${room.gamestate.mode}) was finished: ${roomOrderNumber == 1 ? "red" : "blue"} got the ball stuck`);
            }

            GamestateEmitter.emitNodeConnected(inviteCode, {
                point: node.point,
                player: roomOrderNumber,
                bounceable,
                canMove: canMoveBall,
                inGoalpost,
                selfGoal,
                redBlocked,
                blueBlocked,
                winner
            })

            GamestateEmitter.emitBallPositionUpdated(inviteCode, updateData.ballPosition)

            await prisma.gamestate.update({
                where: { id: room.gamestate.id },
                data: updateData
            })
        }, (e) => console.log(e))
    }

    socket.on(SOCKET_EVENT.NODE_CLICKED, handleNodeClicked)
}