import { ServerPitchNode } from "../factory.js";

/**
 * @param {number} wInSquares 
 * @param {number} hInSquares 
 * @returns {ServerPitchNode[]}
 */
function generateNodes(wInSquares, hInSquares) {
    const nodeList = []
    let index = 0;

    for (let i = 0; i < hInSquares + 1; i++) {
        for (let j = 0; j < wInSquares + 1; j++) {
            // Exclude node if it's outside the border
            if (
                (i < hInSquares / 2 - 1 || i > hInSquares / 2 + 1) &&
                (j < 1 || j > wInSquares - 1)
            ) continue

            // Node inside the border
            if (
                (i > 0 && i < hInSquares) &&
                ((j > 1 && j < wInSquares - 1) || ((i == (hInSquares / 2) && (j > 0 && j < wInSquares))))
            ) {
                nodeList.push(ServerPitchNode(index++, "inside", { x: j, y: i }))
            }
            // Node on the border
            else {
                nodeList.push(ServerPitchNode(index++, "border", { x: j, y: i }))
            }
        }
    }

    return nodeList
}

const nodes = generateNodes(12, 8)

export default nodes