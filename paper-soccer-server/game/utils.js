import { PITCH_INFO } from "../constants.js";
import { query } from "../prisma/client.js";
import nodes from "./nodeMap.js";

/**
 * @typedef {object} PitchNode
 * @property {object} node.absLocation Absolute location of the node on the canvas
 * @property {number} node.absLocation.x X coordinate
 * @property {number} node.absLocation.y Y coordinate
 * @property {object} node.gridLocation Node location relative to the grid
 * @property {number} node.gridLocation.x X coordinate
 * @property {number} node.gridLocation.y Y coordinate
 * @property {"border"|"inside"} node.placement How the node is placed on the pitch
 * @property {number} node.point The index of this node, starting from top-left and going from left to right until bottom-right
 */

/**
 * Check if player can move towards this node
 * 
 * @param {string} inviteCode Invite code for room where this take place in
 * @param {number} roomOrderNumber Room order number of the player that made the move
 * @param {PitchNode} node Node object to move towards
 * @returns {Promise<boolean>} Validity of the move
 */
export async function isValidMove(inviteCode, roomOrderNumber, node) {
    let isValid = true

    await query(async (prisma) => {
        const room = await prisma.room.findUnique({
            where: { inviteCode },
            include: { gamestate: { include: { nodes: { include: { relations: true } } } } }
        })
        
        // 1. Check if node is within range constraints
        if (node.point < 0 || node.point > PITCH_INFO.NODE_COUNT - 1) {
            isValid = false
            return
        }

        // 2. Check if this player is the active player
        if (room.gamestate.activePlayer != roomOrderNumber) {
            isValid = false
            return
        }

        // 3. Check if node is neighboring the ball node
        if (!isNeighbour(room.gamestate.ballPosition, node.point)) {
            isValid = false
            return
        }

        // 4. Check if node is in a direct relation with the ball node
        const destNode = room.gamestate.nodes.find(n => n.point == node.point)

        if (destNode && destNode.relations.some(rel => rel.point == room.gamestate.ballPosition)) {
            isValid = false
            return
        }

        // 5. Check if destination node (this node) can be passed through (has 6 relations at most)
        if (destNode && destNode.relations.length > 6) {
            isValid = false
            return
        }

        // 6. If ball node is on border, only allow diagonal clicks
        const ballNode = findNodeByPoint(room.gamestate.ballPosition)
        if (ballNode.placement == "border" && !isNeighbour(room.gamestate.ballPosition, node.point, true)) {
            isValid = false
            return
        }
    }, (e) => console.log(e))

    return isValid
}

/**
 * Find node object inside the provided nodes list by the point property
 * 
 * @param {number} point The index of the node, starting from top-left and going from left to right until bottom-right
 * @returns {PitchNode|undefined} Returns undefined if node at point doesn't exist
 */
export function findNodeByPoint(point) {
    return nodes.find(node => node.point == point)
}

export function isNeighbour(originPoint, point, diagonalsOnly=false) {
    const originNode = findNodeByPoint(originPoint)
    const node = findNodeByPoint(point)
    const { x: ox, y: oy } = originNode.gridLocation
    let isNeighbour = false

    for (let i = oy - 1; i <= oy + 1; diagonalsOnly ? i += 2 : i++) {
        for (let j = ox - 1; j <= ox + 1; diagonalsOnly ? j += 2 : j++) {

            if (i == oy && j == ox) continue

            // Check if point is at one of the neighboring nodes of origin point
            if (node.gridLocation.x == j && node.gridLocation.y == i) {
                isNeighbour = true
                break
            }
        }
    }

    return isNeighbour
}