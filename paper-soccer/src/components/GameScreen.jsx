import { useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import { drawGoalpostDetails, drawGoalpostOpenings, drawGridLines, setupNodes, drawPitchBorder, drawHistory } from "../canvas/pitchComponents"
import { clearNodeEvents, registerNodeEvents } from "../canvas/events"
import { setNodes } from "../state/slices/gameSlice"
import { GAME_STATUS } from "../constants"

import WaitingPopup from "./popups/WaitingPopup"
import CountdownPopup from "./popups/CountdownPopup"

import { io } from "socket.io-client";
import ErrorPage from "./error/ErrorPage"

const [wInSquares, hInSquares] = [12, 8]

function GameScreen() {
	// Own state
	const { id } = useParams()

	// Web socket state
	const [socket, setSocket] = useState(null)
	const [socketError, setSocketError] = useState("")
	const location = useLocation()

	// Redux state
	const theme = useSelector(state => state.theme)
	const { nodes, status, ballPosition, history, countdown } = useSelector(state => state.game)
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
	const nodeRadius = useMemo(() => Math.round(12 * ratio), [ratio])
	const ballRadius = useMemo(() => Math.round(8 * ratio), [ratio])
	const width = useMemo(() => gridSquareSize * wInSquares + borderWidth, [gridSquareSize, borderWidth])
	const height = useMemo(() => gridSquareSize * hInSquares + borderWidth, [gridSquareSize, borderWidth])

	// TODO Validate if param ID exists in the database before rendering

	useEffect(() => {
		if(socket != null) {
			if (!location.pathname.startsWith("/game") && socket != null) {
				//socket.disconnect()
			}
		}
	}, [location, socket])

	// Connect to web socket server
	useEffect(() => {
		const skt = io(`${import.meta.env.VITE_SERVER_ADDRESS}:${import.meta.env.VITE_SERVER_PORT}`, {
			query: `room=${id}`
		})

		skt.on('connect_error', () => {
			setSocketError("We have encountered a connection problem on our side. Please try again later")
			skt.disconnect()
		})

		setSocket(skt)
	}, [id])

	useEffect(() => {
		setContext(canvasElement.current.getContext("2d", { willReadFrequently: true }))
	}, [ctx, canvasElement]);

	// Redraw pitch frame on theme or size changes
	useEffect(() => {
		if(ctx) {
			// Clear previous drawings
			ctx.clearRect(0, 0, width, height)

			// Draw pitch
			drawGoalpostDetails(ctx, width, hInSquares, borderWidth, borderStrokeColor, gridSquareSize)
			drawPitchBorder(ctx, width, height, borderWidth, borderStrokeColor, gridSquareSize)
			drawGridLines(ctx, width, height, wInSquares, hInSquares, gridSquareSize, borderWidth, gridStrokeColor)
			drawGoalpostOpenings(ctx, gridSquareSize, borderWidth, borderStrokeColor)
		}
	}, [ctx, gridSquareSize, borderWidth, borderStrokeColor, gridStrokeColor, nodeRadius, width, height, history])

	// Reset nodes and their events on ratio change (screen resize)
	useEffect(() => {
		clearNodeEvents(canvasElement.current)
		const nodeList = setupNodes(nodeRadius, wInSquares, hInSquares, gridSquareSize)
		dispatch(setNodes(nodeList))
	}, [nodeRadius, gridSquareSize, dispatch])

	// Draw match history from state
	useEffect(() => {
		if(nodes.length > 0 && ctx) {
			drawHistory(ctx, ballRadius, ballColor, nodes[ballPosition], history, nodes, redTeamColor, blueTeamColor)
		}
	}, [ctx, nodes, ballRadius, ballColor, ballPosition, history, redTeamColor, blueTeamColor])

	// Disable events if the game didn't start
	useEffect(() => {
		switch(status) {
			case GAME_STATUS.ONGOING:
				if(nodes.length > 0)
					registerNodeEvents(canvasElement.current, nodes, nodeRadius)
				break
			default:
				clearNodeEvents(canvasElement.current)
		}
	}, [status, nodes, nodeRadius])

	if(socketError.length > 0) return <ErrorPage message={socketError}/>

	return (
		<div className="flex flex-col items-center justify-center w-full h-full space-y-10 select-none dark:text-dark">
			{
				status == "WAITING" ? (
					<WaitingPopup inviteCode={id}/>
				) : status == "STARTING" ? (
					<CountdownPopup count={countdown}/>
				) : <></>
			}

			<div className={`w-[${width}]`}>
				<div className="flex justify-between w-full font-strokedim">
					<div style={{paddingLeft: gridSquareSize}}>
						<h1 className="text-4xl">Player 1</h1>
						<h2 className="text-2xl">Score: 0</h2>
					</div>

					<div className={`flex flex-col items-end`} style={{ paddingRight: gridSquareSize }}>
						<h1 className="text-4xl">Player 2</h1>
						<h2 className="text-2xl">Score: 0</h2>
					</div>
				</div>

				<canvas ref={canvasElement} width={width} height={height} className="mt-6"></canvas>
			</div>
		</div>
	)
}

export default GameScreen