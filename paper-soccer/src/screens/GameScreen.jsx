import { useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams } from "react-router-dom"
import { drawGoalpostDetails, drawGoalpostOpenings, drawGridLines, setupNodes, drawPitchBorder, drawHistory } from "../canvas/pitchComponents"
import { clearNodeEvents, registerNodeEvents } from "../canvas/events"
import { setNodes } from "../state/slices/gameSlice"
import { GAME_STATUS, SOCKET_EVENT } from "../constants"

import WaitingPopup from "../components/popups/WaitingPopup"
import CountdownPopup from "../components/popups/CountdownPopup"

import ErrorPage from "../screens/error/ErrorPage"
import { fetchRequest } from "../utils"
import LoadingScreen from "./LoadingScreen"
import { connectToSocket, disconnectFromSocket } from "../state/slices/socketSlice"
import { socketClient } from "../main"

const [wInSquares, hInSquares] = [12, 8]

function GameScreen() {
	// Own state
	const { id: inviteCode } = useParams()
	const [isLoading, toggleLoading] = useState(true)

	// Web socket state
	//const [socket, setSocket] = useState(undefined)
	const [socketError, setSocketError] = useState("")

	// Redux state
	const theme = useSelector(state => state.theme)
	const { clientUsername, nodes, status, ballPosition, history, countdown } = useSelector(state => state.game)
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

	// Disconnect on socket error
	useEffect(() => {
		dispatch(disconnectFromSocket())
	}, [socketError])

	// Setup: Handle socket connect/disconnect
	useEffect(() => {
		const onConnect = () => {
			toggleLoading(false)
		}

		const onConnectError = () => {
			setSocketError("We have encountered a connection problem on our side. Please try again later")
		}

		const onPlayerError = (res) => {
			setSocketError(res.message)
		}

		(async () => {
			// Only connect if invite code in route is valid
			await fetchRequest("/api/rooms/" + inviteCode)
				.then(res => {
					if (res.status == 200) {
						dispatch(connectToSocket({ room: inviteCode, username: clientUsername }))

						socketClient.socket.on("connect", onConnect)
						socketClient.socket.on("connect_error", onConnectError)
						socketClient.socket.on(SOCKET_EVENT.PLAYER_ERROR, onPlayerError)
					} else if (res.status == 204) {
						setSocketError("Oops! This invite code doesn't belong to any room..")
					}
				}).catch(() => {
					setSocketError("We have encountered a problem on our side. Please try again later")
				})
		})()

		return () => {
			socketClient.socket.off("connect", onConnect)
			socketClient.socket.off("connect_error", onConnectError)
			socketClient.socket.off(SOCKET_EVENT.PLAYER_ERROR, onPlayerError)

			dispatch(disconnectFromSocket())
		}
	}, [])

	// Fetch canvas context when page is successfully loaded
	useEffect(() => {
		if(!isLoading && socketError.length == 0) {
			setContext(canvasElement.current.getContext("2d", { willReadFrequently: true }))
		}
	}, [isLoading, socketError, ctx, canvasElement]);

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

	if (isLoading) return <LoadingScreen />

	return (
		<div className="flex flex-col items-center justify-center w-full h-full space-y-10 select-none dark:text-dark">
			{
				status == "WAITING" ? (
					<WaitingPopup inviteCode={inviteCode}/>
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