/**
 * @typedef {object} PitchNode
 * @property {"border"|"inside"} node.placement How the node is placed on the pitch
 * @property {number} node.point The index of this node, starting from top-left and going from left to right until bottom-right
 * @property {object} node.absLocation Absolute location of the node on the canvas
 * @property {number} node.absLocation.x X coordinate
 * @property {number} node.absLocation.y Y coordinate
 * @property {object} node.gridLocation Node location relative to the grid
 * @property {number} node.gridLocation.x X coordinate
 * @property {number} node.gridLocation.y Y coordinate
 */

/**
 * @param {"border"|"inside"} node.placement How the node is placed on the pitch
 * @param {number} node.point The index of this node, starting from top-left and going from left to right until bottom-right
 * @param {object} node.absLocation Absolute location of the node on the canvas
 * @param {number} node.absLocation.x X coordinate
 * @param {number} node.absLocation.y Y coordinate
 * @param {object} node.gridLocation Node location relative to the grid
 * @param {number} node.gridLocation.x X coordinate
 * @param {number} node.gridLocation.y Y coordinate
 * @returns {PitchNode}
 */
export const PitchNode = (point, placement, absLocation, gridLocation) => ({ point, placement, absLocation, gridLocation })

/**
 * @typedef {object} ServerPitchNode
 * @property {"border"|"inside"} node.placement How the node is placed on the pitch
 * @property {number} node.point The index of this node, starting from top-left and going from left to right until bottom-right
 * @property {object} node.gridLocation Node location relative to the grid
 * @property {number} node.gridLocation.x X coordinate
 * @property {number} node.gridLocation.y Y coordinate
 */

/**
 * @param {"border"|"inside"} node.placement How the node is placed on the pitch
 * @param {number} node.point The index of this node, starting from top-left and going from left to right until bottom-right
 * @param {object} node.gridLocation Node location relative to the grid
 * @param {number} node.gridLocation.x X coordinate
 * @param {number} node.gridLocation.y Y coordinate
 * @returns {ServerPitchNode}
 */
export const ServerPitchNode = (point, placement, gridLocation) => ({ point, placement, gridLocation })