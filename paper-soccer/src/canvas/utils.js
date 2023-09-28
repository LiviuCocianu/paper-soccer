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

export function clearColor(ctx, x, y, w, h, rgb) {
    const imageData = ctx.getImageData(x, y, w, h)
    const pixels = imageData.data
    const {r, g, b} = rgb

    for (let i = 0; i < imageData.data.length; i += 4) {
        if (pixels[i] === r && pixels[i + 1] === g && pixels[i + 2] === b) {
            pixels[i + 3] = 0
        }
    }

    ctx.putImageData(imageData, x, y)
}

export function hexToRgb(hex) {
    if(hex == "black") return { r: 0, g: 0, b: 0 }

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

export function withinCircle(a, b, x, y, r) {
    return (a - x) * (a - x) + (b - y) * (b - y) < Math.pow(r, 2);
}

/**
 * Find node object inside the provided nodes list by the gridLocation property. Returns undefined if node at gridLocation doesn't exist
 * 
 * @param {object[]} nodes 
 * @param {number} x 
 * @param {number} y
 * @returns {{absLocation: {x: number, y: number}, gridLocation: {x: number, y: number}, placement: "border"|"inside", point: number}|undefined}
 */
export function findNodeByGridLocation(nodes, x, y) {
    return nodes.find(node => node.gridLocation.x == x && node.gridLocation.y == y)
}

/**
 * Find node object inside the provided nodes list by the point property. Returns undefined if node at point doesn't exist
 * 
 * @param {object[]} nodes List of nodes to search in
 * @param {number} point Node point
 * @returns {{absLocation: {x: number, y: number}, gridLocation: {x: number, y: number}, placement: "border"|"inside", point: number}|undefined}
 */
export function findNodeByPoint(nodes, point) {
    return nodes.find(node => node.point == point)
}

export function isNeighbour(nodes, originPoint, point, diagonalsOnly=false) {
    const originNode = findNodeByPoint(nodes, originPoint)
    const node = findNodeByPoint(nodes, point)
    const {x: ox, y: oy} = originNode.gridLocation
    let isNeighbour = false

    if(!originNode || !node) return false

    for(let i = oy - 1; i <= oy + 1; diagonalsOnly ? i += 2 : i++) {
        for (let j = ox - 1; j <= ox + 1; diagonalsOnly ? j += 2 : j++) {

            if (i == oy && j == ox) continue

            // Check if point is at one of the neighboring nodes of origin point
            if(node.gridLocation.x == j && node.gridLocation.y == i) {
                isNeighbour = true
                break
            }
        }
    }

    return isNeighbour
}