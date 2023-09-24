import { GAME_STATUS } from "../constants.js";
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