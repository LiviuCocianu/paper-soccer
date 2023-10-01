import { PITCH_INFO } from "../constants.js";
import { PitchNode } from "../factory.js";
import { query } from "../prisma/client.js";
import nodes from "./nodeMap.js";

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
        const ballNodeDb = room.gamestate.nodes.find(n => n.point == room.gamestate.ballPosition)
        if (ballNodeDb && ballNodeDb.relations.some(rel => rel.point == node.point)) {
            isValid = false
            return
        }
        
        // 5. Check if destination node (this node) can be passed through (has 6 relations at most)
        const destNode = room.gamestate.nodes.find(n => n.point == node.point)
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

/**
 * Find node object inside the provided nodes list by the gridLocation property. Returns undefined if node at gridLocation doesn't exist
 * 
 * @param {number} x 
 * @param {number} y
 * @returns {PitchNode|undefined}
 */
export function findNodeByGridLocation(x, y) {
    return nodes.find(node => node.gridLocation.x == x && node.gridLocation.y == y)
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

/**
 * Check if ball is inside a corner
 * 
 * @param {number} point The index of the node where the ball is
 * @returns {boolean} 
 */
function isInCorner(point) {
    return PITCH_INFO.CORNERS.includes(point)
}

export async function canMove(inviteCode, roomOrderNumber, originPoint) {
    const originNode = findNodeByPoint(originPoint)

    if(!originNode) return false

    const { x: ox, y: oy } = originNode.gridLocation
    let canMove = false

    main: for (let i = oy - 1; i <= oy + 1; i++) {
        for (let j = ox - 1; j <= ox + 1; j++) {
            if (i == oy && j == ox) continue

            const node = findNodeByGridLocation(j, i)

            if(!node) continue

            const isValid = await isValidMove(inviteCode, roomOrderNumber, node)
            
            if (isValid && !isInCorner(originPoint)) {
                canMove = true
                break main
            }
        }
    }

    return canMove
}

/**
 * Check if ball is inside a goalpost
 * 
 * @param {number} point The index of the node where the ball is
 * @returns {1|2|undefined} 
 * 
 * Possible return values:
 * - if ball is in red team's goalpost, return 1
 * - if ball is in blue team's goalpost, return 2
 * - else, return undefined
 */
export function getGoalpostAtBall(point) {
    if(PITCH_INFO.RED_GOAL_NODES.includes(point)) return 1
    if(PITCH_INFO.BLUE_GOAL_NODES.includes(point)) return 2
    return undefined
}

async function haveRelation(prisma, stateId, first, second) {
    if (!first || !second) return false

    const firstNode = await prisma.pitchnode.findFirst({
        where: { stateId, point: first.point },
        include: { relations: true }
    })

    if (firstNode == null || !firstNode.relations.some(n => n.point == second.point)) {
        return false
    }

    return true
}

/**
 * Checks if this line pattern is present at goalpost:
 * https://en.wikipedia.org/wiki/Paper_soccer#/media/File:Pi%C5%82karzyki_blokada_bramki.svg
 * 
 * @param {number} stateId ID of the game state to check
 * @param {boolean} red True for checking the red team goalpost, false for blue team
 * 
 * @returns {Promise<boolean>}
 */
export async function isGoalpostBlocked(stateId, red=true) {
    let isBlocked = true

    await query(async (prisma) => {
        // Check phase 1
        for(let i = 2; i < 5; i++) {
            const first = findNodeByGridLocation(red ? 2 : 10, i)
            const second = findNodeByGridLocation(red ? 1 : 11, i + 1)

            isBlocked = await haveRelation(prisma, stateId, first, second)
            if(!isBlocked) return
        }

        // Check phase 2
        for (let i = 3; i < 6; i++) {
            const first = findNodeByGridLocation(red ? 1 : 11, i)
            const second = findNodeByGridLocation(red ? 2 : 10, i + 1)

            isBlocked = await haveRelation(prisma, stateId, first, second)
            if (!isBlocked) return
        }

        // Check phase 3
        for (let i = 3; i < 6; i++) {
            const first = findNodeByGridLocation(red ? 1 : 10, i)
            const second = findNodeByGridLocation(red ? 2 : 11, i)

            isBlocked = await haveRelation(prisma, stateId, first, second)
            if (!isBlocked) return
        }

        // Check phase 4
        for (let i = 2; i < 6; i++) {
            const first = findNodeByGridLocation(red ? 2 : 10, i)
            const second = findNodeByGridLocation(red ? 2 : 10, i + 1)

            isBlocked = await haveRelation(prisma, stateId, first, second)
            if (!isBlocked) return
        }
    }, (e) => console.log(e))

    return isBlocked;
}