import { GAME_STATUS, SOCKET_EVENT } from "../constants.js";
import { canMove, getGoalpostAtBall, isGoalpostBlocked, isValidMove } from "../game/utils.js";
import { query } from "../prisma/client.js";
import { GamestateEmitter } from "./emitters.js";

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

            if (!player) return

            console.log("");
            console.log(`Player (NAME=${player.username}, ID=${player.id}) disconnected from room (INVITE=${player.invitedTo})`);

            const playerCount = await prisma.player.count({
                where: { invitedTo: player.invitedTo }
            })

            // Cancel game on player disconnect
            // The room will remain active until all sockets disconnect from it
            if(playerCount == 1) {
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

                console.log(`Room (INVITE=${player.invitedTo}) was suspended: opponent left the game`);
            } 
            // Delete room if all sockets disconnected from it
            else if (playerCount == 0) {
                const deleted = await prisma.room.delete({
                    where: { inviteCode: player.invitedTo }
                })

                if (!deleted) return

                console.log(`Room (INVITE=${deleted.inviteCode}) was deleted: no players left, room went unused`);
            }
        }, (e) => console.log(e))
    })
}

export function onNodeClicked(socket) {
    /**
     * @param {string} inviteCode Invite code corresponding to the room this node belongs to
     * @param {number} roomOrderNumber Room order number corresponding to the player that clicked
     * @param {import("../game/utils.js").PitchNode} node Clicked node object
     */
    const handleNodeClicked = async (inviteCode, roomOrderNumber, node) => {
        const isValid = await isValidMove(inviteCode, roomOrderNumber, node)

        if (isValid) {
            query(async (prisma) => {
                const room = await prisma.room.findUnique({
                    where: { inviteCode },
                    include: { gamestate: { include: { nodes: true } } }
                })

                // Get ball node
                const ballNode = await prisma.pitchnode.findFirst({
                    where: { stateId: room.gamestate.id, point: room.gamestate.ballPosition }
                })

                await prisma.pitchnoderelation.create({
                    data: { nodeId: ballNode.id, point: node.point, creator: roomOrderNumber }
                })

                let clickedNode;

                // Add clicked node if not exists
                if (room.gamestate.nodes.every(n => n.point != node.point)) {
                    clickedNode = await prisma.pitchnode.create({
                        data: { stateId: room.gamestate.id, point: node.point }
                    })
                } else {
                    clickedNode = await prisma.pitchnode.findFirst({
                        where: { stateId: room.gamestate.id, point: node.point }
                    })
                }

                const clickedRelationsCount = await prisma.pitchnoderelation.count({
                    where: { nodeId: clickedNode.id }
                })

                await prisma.pitchnoderelation.create({
                    data: { nodeId: clickedNode.id, point: ballNode.point, creator: roomOrderNumber }
                })
                
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
                
                let updateData = { ballPosition: node.point }

                if (!bounceable) {
                    updateData.activePlayer = roomOrderNumber == 1 ? 2 : 1
                    winner = redBlocked ? 1 : (blueBlocked ? 2 : winner)
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

                if (!canMoveBall || inGoalpost || (!bounceable && redBlocked)) {
                    updateData.status = GAME_STATUS.FINISHED
                    GamestateEmitter.emitStatusUpdated(inviteCode, GAME_STATUS.FINISHED)

                    if(inGoalpost) {
                        console.log("");

                        if(selfGoal) {
                            console.log(`Room (INVITE=${inviteCode}) was finished: ${roomOrderNumber == 1 ? "red" : "blue"} scored an own goal`);
                        } else {
                            console.log(`Room (INVITE=${inviteCode}) was finished: ${winner == 1 ? "red" : "blue"} team won`);
                        }
                    } else if (!bounceable && (redBlocked || blueBlocked)) {
                        console.log("");
                        console.log(`Room (INVITE=${inviteCode}) was finished: ${redBlocked ? "red" : "blue"} goalpost got blocked`);
                    } else if (!canMoveBall) {
                        console.log("");
                        console.log(`Room (INVITE=${inviteCode}) was finished: ${roomOrderNumber == 1 ? "red" : "blue"} got the ball stuck`);
                    }
                }

                await prisma.gamestate.update({
                    where: { id: room.gamestate.id },
                    data: updateData
                })
            }, (e) => console.log(e))
        }
    }

    socket.on(SOCKET_EVENT.NODE_CLICKED, handleNodeClicked)
}