/**
 * @typedef {object} PitchNode
 * @property {object} absLocation Absolute location of the node on the canvas
 * @property {number} absLocation.x X coordinate
 * @property {number} absLocation.y Y coordinate
 * @property {object} gridLocation Node location relative to the grid
 * @property {number} gridLocation.x X coordinate
 * @property {number} gridLocation.y Y coordinate
 * @property {"border"|"inside"} placement How the node is placed on the pitch
 * @property {number} point The index of this node, starting from top-left and going from left to right until bottom-right
 */

/**
 * @typedef {object} HistoryRelation
 * @property {number} point Node point that parent node is connected to
 * @property {number} player Order number corresponding to player that created the relation
 */

/**
 * @typedef {Object<number, HistoryRelation[]>} GameHistory
 * @description A collection of node points and their relations
 */

import { PITCH_INFO } from "./constants"

/**
 * Find node object inside the provided nodes list by the gridLocation property. Returns undefined if node at gridLocation doesn't exist
 * 
 * @param {PitchNode[]} nodes 
 * @param {number} x 
 * @param {number} y
 * @returns {PitchNode|undefined}
 */
export function findNodeByGridLocation(nodes, x, y) {
    return nodes.find(node => node.gridLocation.x == x && node.gridLocation.y == y)
}

/**
 * Find node object inside the provided nodes list by the point property. Returns undefined if node at point doesn't exist
 * 
 * @param {PitchNode[]} nodes List of nodes to search in
 * @param {number} point Node point
 * @returns {PitchNode|undefined}
 */
export function findNodeByPoint(nodes, point) {
    return nodes.find(node => node.point == point)
}

/**
 * Check if player can move towards this node
 * 
 * @param {PitchNode[]} nodes All the existing nodes on the pitch, regardless of relations
 * @param {PitchNode} node Node object to move towards
 * @param {object} gameState Redux game state
 * @param {GameHistory} gameState.history Game history
 * @param {number} gameState.ballPosition Ball position
 * @param {number} gameState.activePlayer Order number of the active player
 * 
 * @returns {boolean}
 */
export function isValidMove(nodes, node, gameState) {
    // 1. Check if node is within range constraints
    if (node.point < 0 || node.point > PITCH_INFO.NODE_COUNT - 1) {
        return false
    }

    // 2. Check if node is neighboring the ball node
    if (!isNeighbour(nodes, gameState.ballPosition, node.point)) {
        return false
    }

    // 3. Check if node is in a direct relation with the ball node
    if (gameState.history[gameState.ballPosition] && gameState.history[gameState.ballPosition].some(rel => rel.point == node.point)) {
        return false
    }

    // 4. Check if destination node (this node) can be passed through (has 6 relations at most)
    if (gameState.history[node.point] && gameState.history[node.point].length > 6) {
        return false
    }

    // 5. If ball node is on border, only allow diagonal clicks
    const ballNode = findNodeByPoint(nodes, gameState.ballPosition)
    if (ballNode.placement == "border" && !isNeighbour(nodes, gameState.ballPosition, node.point, true)) {
        return false
    }

    // 6. If ball attempts to go out of bounds to the corner of a goalpost
    if (
        (gameState.ballPosition == 72 && node.point == 59) ||
        (gameState.ballPosition == 22 && node.point == 33) ||
        (gameState.ballPosition == 82 && node.point == 71) ||
        (gameState.ballPosition == 32 && node.point == 45)
    ) return false

    return true
}

/**
 * Check if point is neighbouring the origin point
 * 
 * @param {PitchNode[]} nodes All the existing nodes on the pitch, regardless of relations
 * @param {number} originPoint Point to check neighbours for
 * @param {number} point Point that is supposed to be neighbouring the origin
 * @param {boolean} [diagonalsOnly] If true, only check neighbours diagonally. Value is false by default
 * 
 * @returns {boolean}
 */
export function isNeighbour(nodes, originPoint, point, diagonalsOnly = false) {
    const originNode = findNodeByPoint(nodes, originPoint)
    const node = findNodeByPoint(nodes, point)

    if (!originNode || !node) return false

    const { x: ox, y: oy } = originNode.gridLocation
    let isNeighbour = false

    main: for (let i = oy - 1; i <= oy + 1; diagonalsOnly ? i += 2 : i++) {
        for (let j = ox - 1; j <= ox + 1; diagonalsOnly ? j += 2 : j++) {
            if (i == oy && j == ox) continue

            // Check if point is at one of the neighboring nodes of origin point
            if (node.gridLocation.x == j && node.gridLocation.y == i) {
                isNeighbour = true
                break main
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

/**
 * Check if there are any available nodes to move towards from the origin
 * 
 * @param {PitchNode[]} nodes All the existing nodes on the pitch, regardless of relations
 * @param {number} roomOrderNumber Number corresponding to the player that is moving
 * @param {number} originPoint Origin point to check
 * @param {object} gameState Redux game state
 * @param {GameHistory} gameState.history Game history
 * @param {number} gameState.ballPosition Ball position
 * @param {number} gameState.activePlayer Order number of the active player
 * @returns {boolean}
 */
export function canMove(nodes, roomOrderNumber, gameState) {
    const originNode = findNodeByPoint(nodes, gameState.ballPosition)

    if (!originNode) return false

    const { x: ox, y: oy } = originNode.gridLocation
    let canMove = false

    main: for (let i = oy - 1; i <= oy + 1; i++) {
        for (let j = ox - 1; j <= ox + 1; j++) {
            if (i == oy && j == ox) continue

            const node = findNodeByGridLocation(nodes, j, i)

            if (!node) continue

            const isValid = isValidMove(nodes, node, gameState)

            if (isValid && !isInCorner(gameState.ballPosition)) {
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
    if (PITCH_INFO.RED_GOAL_NODES.includes(point)) return 1
    if (PITCH_INFO.BLUE_GOAL_NODES.includes(point)) return 2
    return undefined
}

/**
 * Check if these nodes have a relation
 * 
 * @param {GameHistory} history 
 * @param {PitchNode} first 
 * @param {PitchNode} second 
 * @returns {boolean}
 */
function haveRelation(history, first, second) {
    if (!first || !second) return false

    const firstRefersSecond = history[first.point] && !history[first.point].some(rel => rel.point == second.point)
    const secondRefersFirst = history[second.point] && !history[second.point].some(rel => rel.point == first.point)

    if (!firstRefersSecond && !secondRefersFirst) {
        return false
    }

    return true
}

/**
 * Checks if this line pattern is present at goalpost:
 * https://en.wikipedia.org/wiki/Paper_soccer#/media/File:Pi%C5%82karzyki_blokada_bramki.svg
 * 
 * @param {boolean} [red] True for checking the red team goalpost, false for blue team. Value is true by default
 * 
 * @returns {boolean}
 */
export function isGoalpostBlocked(nodes, history, red = true) {
    // Check phase 1
    for (let i = 2; i < 5; i++) {
        const first = findNodeByGridLocation(nodes, red ? 2 : 10, i)
        const second = findNodeByGridLocation(nodes, red ? 1 : 11, i + 1)

        if (!haveRelation(history, first, second)) return false
    }

    // Check phase 2
    for (let i = 3; i < 6; i++) {
        const first = findNodeByGridLocation(nodes, red ? 1 : 11, i)
        const second = findNodeByGridLocation(nodes, red ? 2 : 10, i + 1)

        if (!haveRelation(history, first, second)) return false
    }

    // Check phase 3
    for (let i = 3; i < 6; i++) {
        const first = findNodeByGridLocation(nodes, red ? 1 : 10, i)
        const second = findNodeByGridLocation(nodes, red ? 2 : 11, i)

        if (!haveRelation(history, first, second)) return false
    }

    // Check phase 4
    for (let i = 2; i < 6; i++) {
        const first = findNodeByGridLocation(nodes, red ? 2 : 10, i)
        const second = findNodeByGridLocation(nodes, red ? 2 : 10, i + 1)

        if (!haveRelation(history, first, second)) return false
    }

    return true
}

/**
 * Get the distance between a point and a goalpost
 * 
 * @param {PitchNode} node Starting node
 * @param {boolean} [red] If the target goalpost belongs to ream team. Value is true by default
 * 
 * @returns {number} Distance in grid squares. Can be a float
 */
export function getDistance(nodes, node, red = true) {
    const goalpostPoint = red ? PITCH_INFO.RED_GOAL_NODES[0] : PITCH_INFO.BLUE_GOAL_NODES[0]
    const goalpostNode = findNodeByPoint(nodes, goalpostPoint)

    const { x: nx, y: ny } = node.gridLocation
    const { x: gx, y: gy } = goalpostNode.gridLocation

    const distX = Math.max(nx, gx) - Math.min(nx, gx)
    const distY = Math.max(ny, gy) - Math.min(ny, gy)

    return Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2))
}