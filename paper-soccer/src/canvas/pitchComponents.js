import { clearColor, findNodeByGridLocation, findNodeByPoint, hexToRgb } from "./utils"

export function drawPitchBorder(ctx, w, h, borderWidth, borderColor, gridSquareSize) {
    ctx.beginPath()
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderWidth

    // Draw pitch border
    ctx.roundRect(gridSquareSize + borderWidth / 2, borderWidth / 2, w - (gridSquareSize * 2) - borderWidth, h - borderWidth, 10)
    ctx.stroke()

    // Draw goal posts
    ctx.roundRect(borderWidth / 2, gridSquareSize * 3, gridSquareSize - borderWidth, gridSquareSize * 2, [10, 0, 0, 10])
    ctx.roundRect(gridSquareSize * 11 + borderWidth * 1.5, gridSquareSize * 3, gridSquareSize - borderWidth, gridSquareSize * 2, [0, 10, 10, 0])
    ctx.stroke()
}

export function drawGridLines(ctx, w, h, wInSquares, hInSquares, gridSquareSize, borderWidth, lineColor) {
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1
    ctx.beginPath()

    // Draw grid lines
    // Horizontal
    for (let i = 1; i < hInSquares; i++) {
        const y = gridSquareSize * i
        const x1 = i == (hInSquares / 2) ? borderWidth + 8 : gridSquareSize + borderWidth;
        const x2 = i == (hInSquares / 2) ? w - borderWidth - 8 : w - gridSquareSize - borderWidth;

        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.stroke()
    }

    // Vertical
    for (let i = 1; i < wInSquares; i++) {
        const x = gridSquareSize * i + borderWidth / 2
        const y1 = i == 1 || i == wInSquares - 1 ? gridSquareSize * (hInSquares / 2 - 1) + borderWidth / 2 : borderWidth;
        const y2 = i == 1 || i == wInSquares - 1 ? gridSquareSize * (hInSquares / 2 + 1) - borderWidth / 2 : h - borderWidth;

        ctx.moveTo(x, y1)
        ctx.lineTo(x, y2)
        ctx.stroke()
    }

    ctx.stroke()
}

export function setupNodes(nodeRadius, wInSquares, hInSquares, gridSquareSize) {
    const nodeList = []
    let index = 0;

    for(let i = 0; i < hInSquares + 1; i++) {
        for(let j = 0; j < wInSquares + 1; j++) {
            const y = gridSquareSize * i
            const x = gridSquareSize * j

            // Exclude node if it's outside the border
            if (
                (i < hInSquares / 2 - 1 || i > hInSquares / 2 + 1) &&
                (j < 1 || j > wInSquares - 1)
            ) continue
            
            // Node inside the border
            if(
                (i > 0 && i < hInSquares) &&
                ((j > 1 && j < wInSquares - 1) || ((i == (hInSquares / 2) && (j > 0 && j < wInSquares))))
            ) {
                nodeList.push({
                    point: index++,
                    gridLocation: { x: j, y: i },
                    absLocation: { x: x + nodeRadius / 4, y },
                    placement: "inside"
                })
            } 
            // Node on the border
            else {
                nodeList.push({
                    point: index++,
                    gridLocation: { x: j, y: i },
                    absLocation: { x: x + nodeRadius / 4, y },
                    placement: "border"
                })
            }
        }
    }

    return nodeList
}

export function drawGoalpostDetails(ctx, width, hInSquares, borderWidth, borderColor, gridSquareSize) {
    ctx.beginPath()
    ctx.strokeStyle = "#ff7f7f"
    ctx.lineWidth = 10
    ctx.moveTo(borderWidth * 1.5, gridSquareSize * (hInSquares / 2 - 1) + borderWidth / 2)
    ctx.lineTo(borderWidth * 1.5, gridSquareSize * (hInSquares / 2 + 1) - borderWidth / 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.strokeStyle = "#807fff"
    ctx.moveTo(width - borderWidth * 1.5, gridSquareSize * (hInSquares / 2 - 1) + borderWidth / 2)
    ctx.lineTo(width - borderWidth * 1.5, gridSquareSize * (hInSquares / 2 + 1) - borderWidth / 2)
    ctx.stroke()
}

export function drawGoalpostOpenings(ctx, gridSquareSize, borderWidth, borderColor) {
    const rgbBorderColor = hexToRgb(borderColor)
    clearColor(ctx, gridSquareSize - borderWidth, gridSquareSize * 3 + (borderWidth / 2), borderWidth * 2, gridSquareSize * 2 - borderWidth, rgbBorderColor)
    clearColor(ctx, gridSquareSize * 11, gridSquareSize * 3 + (borderWidth / 2), borderWidth * 2, gridSquareSize * 2 - borderWidth, rgbBorderColor)
}

export function drawHistory(ctx, ballRadius, ballColor, ballLocation, history, nodes, redTeamColor, blueTeamColor) {
    // Draw player moves (history)
    ctx.lineWidth = 3
    for(const [point, relations] of Object.entries(history)) {
        const pointNode = findNodeByPoint(nodes, parseInt(point))
        const pointLoc = pointNode.absLocation
        
        for(const relation of relations) {
            const relationLoc = findNodeByPoint(nodes, relation.point).absLocation
            
            ctx.beginPath()
            ctx.strokeStyle = relation.player == 1 ? redTeamColor : blueTeamColor

            ctx.moveTo(pointLoc.x, pointLoc.y)
            ctx.lineTo(relationLoc.x, relationLoc.y)
            ctx.stroke()
        }
    }

    // Draw ball
    drawBall(ctx, ballRadius, ballColor, ballLocation)
}

function drawBall(ctx, ballRadius, ballColor, node) {
    ctx.fillStyle = ballColor
    ctx.beginPath()
    ctx.arc(node.absLocation.x, node.absLocation.y, ballRadius, 0, 2 * Math.PI)
    ctx.fill()
}