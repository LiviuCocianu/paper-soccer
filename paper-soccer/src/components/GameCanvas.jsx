import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { clearColor, findNodeByPoint, hexToRgb, isNeighbour, withinCircle } from "../canvas/utils"
import { setNodes } from "../state/slices/gameSlice"
import { GAME_STATUS } from "../constants"


const [wInSquares, hInSquares] = [12, 8]

function GameCanvas({ isLoading, isConnected, ownOrder, onWidth }) {
    const [events, setEvents] = useState([])
    const [hoveredNode, setHoveredNode] = useState(0)

    const theme = useSelector(state => state.theme)
    const { nodes, activePlayer, status, ballPosition, history } = useSelector(state => state.game)
    const dispatch = useDispatch()

    // Theme colors for game interface
    const borderStrokeColor = useMemo(() => theme == "light" ? "black" : "#d9deff", [theme])
    const gridStrokeColor = useMemo(() => theme == "light" ? "gray" : "#135314", [theme])
    const ballColor = useMemo(() => theme == "light" ? "#ff6700" : "#fc9a58", [theme])
    const redTeamColor = useMemo(() => theme == "light" ? "red" : "#dd1717", [theme])
    const blueTeamColor = useMemo(() => theme == "light" ? "blue" : "#0f4392", [theme])

    // Canvas objects
    const canvasElement = useRef(null)
    const [ctx, setContext] = useState()

    // Game interface measurements
    const [ratio, setRatio] = useState(1)
    const gridSquareSize = useMemo(() => Math.round(50 * ratio), [ratio])
    const borderWidth = useMemo(() => Math.round(6 * ratio), [ratio])
    const nodeRadius = useMemo(() => Math.round(14 * ratio), [ratio])
    const ballRadius = useMemo(() => Math.round(8 * ratio), [ratio])
    const width = useMemo(() => gridSquareSize * wInSquares + borderWidth, [gridSquareSize, borderWidth])
    const height = useMemo(() => gridSquareSize * hInSquares + borderWidth, [gridSquareSize, borderWidth])

    
    const drawPreviewLine = useCallback(() => {
        if (nodes.length == 0 || !ctx) return
        if (hoveredNode == ballPosition) return

        if (isNeighbour(nodes, ballPosition, hoveredNode)) {
            const ballAbs = findNodeByPoint(nodes, ballPosition).absLocation
            const toAbs = findNodeByPoint(nodes, hoveredNode).absLocation

            ctx.beginPath()
            ctx.setLineDash([10]);
            ctx.strokeStyle = ownOrder == 1 ? redTeamColor : blueTeamColor
            ctx.lineWidth = 4

            ctx.moveTo(ballAbs.x, ballAbs.y)
            ctx.lineTo(toAbs.x, toAbs.y)
            ctx.stroke()

            ctx.setLineDash([])
        }
    }, [hoveredNode, ballPosition, blueTeamColor, redTeamColor, ctx])

    const CLICK_EVENT = useCallback(e => {
        const x = e.pageX - e.currentTarget.offsetLeft;
        const y = e.pageY - e.currentTarget.offsetTop;

        for (const node of nodes) {
            if (withinCircle(x, y, node.absLocation.x, node.absLocation.y, nodeRadius) 
                && node.point != ballPosition
                && activePlayer == ownOrder
            ) {
                if(!isNeighbour(nodes, ballPosition, node.point)) return
                
                console.log("clicked node", node); // TODO debug
            }
        }
    }, [nodes, nodeRadius, ballPosition, activePlayer, ownOrder])

    const HOVER_EVENT = useCallback(e => {
        const x = e.pageX - e.currentTarget.offsetLeft;
        const y = e.pageY - e.currentTarget.offsetTop;

        let found = false;

        for (const node of nodes) {
            if (withinCircle(x, y, node.absLocation.x, node.absLocation.y, nodeRadius) 
                && node.point != ballPosition
                && activePlayer == ownOrder
            ) {
                if (!isNeighbour(nodes, ballPosition, node.point)) break

                canvasElement.current.classList.add("cursor-pointer")
                found = true

                setHoveredNode(node.point)
                break
            }
        }

        if (!found) canvasElement.current.classList.remove("cursor-pointer")
    }, [nodes, nodeRadius, activePlayer, ownOrder, ballPosition])

    const registerNodeEvents = useCallback(() => {
        setEvents(prev => {
            if(prev.length == 0) {
                canvasElement.current.addEventListener("click", CLICK_EVENT)
                canvasElement.current.addEventListener("mousemove", HOVER_EVENT)

                return [
                    { type: "click", value: CLICK_EVENT },
                    { type: "mousemove", value: HOVER_EVENT }
                ]
            }

            return prev
        })
    }, [CLICK_EVENT, HOVER_EVENT])

    const unregisterNodeEvents = () => {
        setEvents(prev => {
            if(prev.length > 0) {
                for (const event of events) canvasElement.current.removeEventListener(event.type, event.value)
                return []
            }

            return prev
        })
    }

    const createNodeListState = useCallback(() => {
        const nodeList = []
        let index = 0;

        for (let i = 0; i < hInSquares + 1; i++) {
            for (let j = 0; j < wInSquares + 1; j++) {
                const y = gridSquareSize * i
                const x = gridSquareSize * j

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
    }, [gridSquareSize, nodeRadius])

    const drawGoalpostDetails = useCallback(() => {
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
    }, [borderWidth, ctx, gridSquareSize, width])

    const drawPitchBorder = useCallback(() => {
        ctx.beginPath()
        ctx.strokeStyle = borderStrokeColor
        ctx.lineWidth = borderWidth

        // Draw pitch border
        ctx.roundRect(gridSquareSize + borderWidth / 2, borderWidth / 2, width - (gridSquareSize * 2) - borderWidth, height - borderWidth, 10)
        ctx.stroke()

        // Draw goal posts
        ctx.roundRect(borderWidth / 2, gridSquareSize * 3, gridSquareSize - borderWidth, gridSquareSize * 2, [10, 0, 0, 10])
        ctx.roundRect(gridSquareSize * 11 + borderWidth * 1.5, gridSquareSize * 3, gridSquareSize - borderWidth, gridSquareSize * 2, [0, 10, 10, 0])
        ctx.stroke()
    }, [borderStrokeColor, borderWidth, ctx, gridSquareSize, width, height])

    const drawGridLines = useCallback(() => {
        ctx.strokeStyle = gridStrokeColor
        ctx.lineWidth = 1
        ctx.beginPath()

        // Draw grid lines
        // Horizontal
        for (let i = 1; i < hInSquares; i++) {
            const y = gridSquareSize * i
            const x1 = i == (hInSquares / 2) ? borderWidth + 8 : gridSquareSize + borderWidth;
            const x2 = i == (hInSquares / 2) ? width - borderWidth - 8 : width - gridSquareSize - borderWidth;

            ctx.moveTo(x1, y)
            ctx.lineTo(x2, y)
            ctx.stroke()
        }

        // Vertical
        for (let i = 1; i < wInSquares; i++) {
            const x = gridSquareSize * i + borderWidth / 2
            const y1 = i == 1 || i == wInSquares - 1 ? gridSquareSize * (hInSquares / 2 - 1) + borderWidth / 2 : borderWidth;
            const y2 = i == 1 || i == wInSquares - 1 ? gridSquareSize * (hInSquares / 2 + 1) - borderWidth / 2 : height - borderWidth;

            ctx.moveTo(x, y1)
            ctx.lineTo(x, y2)
            ctx.stroke()
        }

        ctx.stroke()
    }, [ctx, width, height, borderWidth, gridSquareSize, gridStrokeColor])

    const drawGoalpostOpenings = useCallback(() => {
        const rgbBorderColor = hexToRgb(borderStrokeColor)
        clearColor(ctx, gridSquareSize - borderWidth, gridSquareSize * 3 + (borderWidth / 2), borderWidth * 2, gridSquareSize * 2 - borderWidth, rgbBorderColor)
        clearColor(ctx, gridSquareSize * 11, gridSquareSize * 3 + (borderWidth / 2), borderWidth * 2, gridSquareSize * 2 - borderWidth, rgbBorderColor)
    }, [ctx, borderStrokeColor, borderWidth, gridSquareSize])

    const drawBall = useCallback((node) => {
        ctx.fillStyle = ballColor
        ctx.beginPath()
        ctx.arc(node.absLocation.x, node.absLocation.y, ballRadius, 0, 2 * Math.PI)
        ctx.fill()
    }, [ctx, ballColor, ballRadius])

    const drawHistory = useCallback((ballLocation) => {
        // Draw player moves (history)
        ctx.lineWidth = 3

        for (const [point, relations] of Object.entries(history)) {
            const pointNode = findNodeByPoint(nodes, parseInt(point))
            const pointLoc = pointNode.absLocation

            for (const relation of relations) {
                const relationLoc = findNodeByPoint(nodes, relation.point).absLocation

                ctx.beginPath()
                ctx.strokeStyle = relation.player == 1 ? redTeamColor : blueTeamColor

                ctx.moveTo(pointLoc.x, pointLoc.y)
                ctx.lineTo(relationLoc.x, relationLoc.y)
                ctx.stroke()
            }
        }

        drawBall(ballLocation)
    }, [ctx, history, nodes, redTeamColor, blueTeamColor, drawBall])

    useEffect(() => {
        onWidth(width)
    }, [width])

    // Fetch canvas context when page is successfully loaded
    useEffect(() => {
        if (!isLoading && isConnected) {
            setContext(canvasElement.current.getContext("2d", { willReadFrequently: true }))
        }
    }, [isLoading, isConnected, ctx, canvasElement]);

    // Redraw pitch frame on theme or size changes
    useEffect(() => {
        if (ctx) {
            // Clear previous drawings
            ctx.clearRect(0, 0, width, height)

            // Draw pitch
            drawGoalpostDetails()
            drawPitchBorder()
            drawGridLines()
            drawGoalpostOpenings()

            drawPreviewLine()
        }
    }, [ctx, width, height, drawGoalpostDetails, drawPitchBorder, drawGridLines, drawGoalpostOpenings, drawPreviewLine, hoveredNode])

    // Reset nodes and their events on ratio change (screen resize)
    useEffect(() => {
        const nodeList = createNodeListState()
        unregisterNodeEvents()
        dispatch(setNodes(nodeList))
    }, [ratio, createNodeListState])

    // Draw match history from state
    useEffect(() => {
        if (nodes.length > 0 && ctx) {
            drawHistory(nodes[ballPosition])
        }
    }, [ctx, nodes, ballPosition, drawHistory, hoveredNode])

    // Disable events if the game didn't start
    useEffect(() => {
        switch (status) {
            case GAME_STATUS.ONGOING:
                if (nodes.length > 0) registerNodeEvents()
                break
            default:
                unregisterNodeEvents()
        }
    }, [status, nodes])

    return (
        <canvas ref={canvasElement} width={width} height={height} className="mt-6"></canvas>
    )
}

export default GameCanvas