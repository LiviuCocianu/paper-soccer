import { SOCKET_EVENT } from "../constants.js";
import io from "../socket/index.js";

export const PlayerEmitter = {
    /**
     * Emit on errors related to the Player object
     * 
     * @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket 
     * @param {string} message 
     */
    emitError: (socket, message) => { socket.emit(SOCKET_EVENT.PLAYER_ERROR, { message }) },
    /**
     * Emit on changes to the name of a player
     * 
     * @param {string} inviteCode
     * @param {number} orderNo
     * @param {string} name
     */
    emitNameUpdated: (inviteCode, orderNo, name) => { io.in(inviteCode).emit(SOCKET_EVENT.PLAYER_NAME_UPDATED, orderNo, name) },
    /**
     * Emit on changes to the name of a player
     * 
     * @param {string} inviteCode
     * @param {number} orderNo
     * @param {number} score
     */
    emitScoreUpdated: (inviteCode, orderNo, score) => { io.in(inviteCode).emit(SOCKET_EVENT.PLAYER_SCORE_UPDATED, orderNo, score) },
    /**
     * Emit the room order number
     * 
     * @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket
     * @param {number} orderNo
     */
    emitRoomOrder: (socket, orderNo) => { socket.emit(SOCKET_EVENT.PLAYER_ROOM_ORDER, orderNo) },
}

export const GamestateEmitter = {
    /**
     * Emit on changes in the game state status of a room
     * 
     * @param {string} inviteCode
     * @param {"WAITING"|"STARTING"|"ONGOING"|"FINISHED"|"SUSPENDED"|"REDUNDANT"} status 
     * @param {function} ack
     */
    emitStatusUpdated: (inviteCode, status, ack = undefined) => { io.to(inviteCode).emit(SOCKET_EVENT.GAMESTATE_STATUS_UPDATED, status, ack) },
    /**
     * Emit on changes in the game state countdown of a room
     * 
     * @param {string} inviteCode
     * @param {number} value
     * @param {function} ack
     */
    emitCountdownUpdated: (inviteCode, value, ack = undefined) => { io.to(inviteCode).emit(SOCKET_EVENT.GAMESTATE_COUNTDOWN_UPDATED, value, ack) },
    /**
     * Emit when node at point connects with the ball node
     * 
     * @param {string} inviteCode
     * @param {object} data
     * @param {number} data.point
     * @param {number} data.player
     * @param {boolean} data.bounceable
     * @param {boolean} data.canMove
     * @param {number} data.activePlayer
     */
    emitNodeConnected: (inviteCode, data) => { io.to(inviteCode).emit(SOCKET_EVENT.NODE_CONNECTED, data) }
}