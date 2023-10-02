import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams, useSearchParams } from "react-router-dom"
import { addHistoryMove, resetGameState, setActivePlayer, setBallPosition, setClientUsername, setCountdown, setGameMode, setHistory, setStatus } from "../state/slices/gameSlice"
import { GAME_MODE, GAME_STATUS, SOCKET_EVENT } from "../constants"

import WaitingPopup from "../components/popups/WaitingPopup"
import CountdownPopup from "../components/popups/CountdownPopup"
import LoadingScreen from "./LoadingScreen"
import ErrorPage from "../screens/error/ErrorPage"
import SuspensionPopup from "../components/popups/SuspensionPopup"
import GameCanvas from "../components/GameCanvas"

import { decodeQueryParam, fetchRequest } from "../utils"
import { connectToSocket, disconnectFromSocket } from "../state/slices/socketSlice"
import { socketClient } from "../main"
import FinishPopup from "../components/popups/FinishPopup"


function GameScreen() {
	// Own state
	const { id: inviteCode } = useParams()
	const [ queryParams ] = useSearchParams()
	const [isLoading, toggleLoading] = useState(true)
	const [finishMessage, setFinishMessage] = useState("")

	const ownOrderRef = useRef(1)
	const modeRef = useRef(GAME_MODE.CLASSIC)
	const statusRef = useRef(GAME_STATUS.WAITING)

	const [scoreboardWidth, setScoreboardWidth] = useState(0)
	const scoreboardIndicatorLeft = useMemo(() => {
		return ownOrderRef.current == 1 ? (<span className="text-xl font-heycomic">(you)</span>) : ""
	}, [ownOrderRef])
	const scoreboardIndicatorRight = useMemo(() => {
		return ownOrderRef.current == 2 ? (<span className="text-xl font-heycomic">(you)</span>) : ""
	}, [ownOrderRef])

	const scoreboardRef = useRef({
		1: { name: "Player 1", score: 0 },
		2: { name: "Player 2", score: 0 }
	})

	// Web socket state
	const socketError = useRef("")

	// Redux state
	const { clientUsername, activePlayer, mode, status, countdown } = useSelector(state => state.game)
	const dispatch = useDispatch()

	const handleNodeClick = useCallback((node) => {
		socketClient.socket.emit(SOCKET_EVENT.NODE_CLICKED, inviteCode, ownOrderRef.current, node)
	}, [inviteCode, ownOrderRef])

	// Disconnect on socket error
	useEffect(() => {
		dispatch(disconnectFromSocket())
	}, [socketError.current])

	// Change game mode ref to use in socket events without the need of state listening
	useEffect(() => {
		modeRef.current = mode
	}, [mode])

	// Change status ref to use in socket events without the need of state listening
	useEffect(() => {
		statusRef.current = status
	}, [status])

	// Change the scoreboard name on username change
	useEffect(() => {
		scoreboardRef.current[ownOrderRef.current].name = clientUsername
	}, [clientUsername, ownOrderRef])

	// Setup: Handle socket connect/disconnect
	useEffect(() => {
		const onConnect = () => {
			toggleLoading(false)
		}

		const onConnectError = () => {
			dispatch(resetGameState())
			if (socketError.current.length == 0)
				socketError.current = "We have encountered a connection problem on our side. Please try again later"
		}

		const onDatabaseError = () => {
			dispatch(resetGameState())
			if (socketError.current.length == 0)
				socketError.current = "We have encountered a connection problem on our side. Please try again later"
		}

		const onPlayerError = (res) => {
			dispatch(resetGameState())
			if (socketError.current.length == 0)
				socketError.current = res.message
		}

		const onBallPositionUpdate = (ballPosFromSocket) => {
			dispatch(setBallPosition(ballPosFromSocket))
		}

		const onStatusUpdate = async (statusFromSocket, ack) => {
			if (statusRef.current == GAME_STATUS.FINISHED) return
			dispatch(setStatus(statusFromSocket))
			if (ack) ack()
		}

		const onCountdownUpdate = (valueFromSocket, ack) => {
			dispatch(setCountdown(valueFromSocket))
			if (ack) ack()
		}

		const onPlayerNameUpdate = (orderNoFromSocket, nameFromSocket) => {
			scoreboardRef.current[orderNoFromSocket].name = nameFromSocket

			if (orderNoFromSocket != ownOrderRef.current) {
				document.title = "Paper Soccer - Multiplayer VS " + nameFromSocket
			}
		}

		const onPlayerScoreUpdate = (orderNoFromSocket, scoreFromSocket) => {
			scoreboardRef.current[orderNoFromSocket].score = scoreFromSocket
		}

		const onPlayerRoomOrder = (orderNoFromSocket) => {
			ownOrderRef.current = orderNoFromSocket
		}

		const onNodeConnected = ({point, player, bounceable, canMove, inGoalpost, selfGoal, redBlocked, blueBlocked, winner}) => {
			dispatch(addHistoryMove({ point, player }))

			if(!canMove || inGoalpost) {
				// Active player = winner
				// This player lost, so the other player will be set as the active one
				dispatch(setActivePlayer(winner))

				if (selfGoal) {
					setFinishMessage(`${scoreboardRef.current[player].name} scored an own goal..`)
					return
				}

				if(inGoalpost) {
					if(modeRef.current == GAME_MODE.BESTOF3) {
						dispatch(setHistory({}))
						setFinishMessage(`${winner == 1 ? "Red" : "Blue"} team scored the most goals!`)
					} else if (modeRef.current == GAME_MODE.CLASSIC) {
						setFinishMessage(`Scored a goal for the ${inGoalpost == 1 ? "blue" : "red"} team!`)
					}
					return
				}

				if(!canMove) {
					setFinishMessage(`${scoreboardRef.current[player].name} got the ball stuck`)
				}

				return
			}

			if (redBlocked || blueBlocked) {
				setFinishMessage(`${scoreboardRef.current[winner].name} blocked their goalpost, not allowing for any further goals`)
				return
			}

			if(!bounceable) {
				dispatch(setActivePlayer(player == 1 ? 2 : 1))
			}
		}

		(async () => {
			// Only connect if invite code in route is valid
			await fetchRequest("/api/rooms/" + inviteCode)
				.then(async res => {
					if (res.status == 200) {
						// Usually we'd fetch the order number through the socket, but we're not connected to it yet
						// Get the player count to find out this player's room order number
						const players = await fetchRequest("/api/players/" + inviteCode)
						let playerCount

						if(players.status == 200) {
							const body = await players.json()
							playerCount = body.result.length
							
							if(playerCount == 1) {
								const opponent = body.result.find(pl => pl.roomOrder == 1)
								document.title = "Paper Soccer - Multiplayer VS " + opponent.username
							}
						}

						const order = playerCount != undefined ? playerCount + 1 : ""

						const stateBody = await fetchRequest("/api/gameStates/" + inviteCode).then(res => res.json())

						// 'clientUsername' is the given username in the "join a room" form, IF given
						const username = queryParams.has("username") 
							? decodeQueryParam(queryParams.get("username"))
							: (clientUsername.length == 0 ? ("Player " + order) : clientUsername)

						// Now connect with the processed username
						dispatch(connectToSocket({ room: inviteCode, username }))
						dispatch(setClientUsername(username))
						dispatch(setGameMode(stateBody.result.mode))

						socketClient.socket.on("connect", onConnect)
						socketClient.socket.on("disconnect", onConnectError)
						socketClient.socket.on("connect_error", onConnectError)
						socketClient.socket.on(SOCKET_EVENT.DATABASE_ERROR, onDatabaseError)
						socketClient.socket.on(SOCKET_EVENT.PLAYER_ERROR, onPlayerError)
						socketClient.socket.on(SOCKET_EVENT.GAMESTATE_BALL_POSITION_UPDATED, onBallPositionUpdate)
						socketClient.socket.on(SOCKET_EVENT.GAMESTATE_STATUS_UPDATED, onStatusUpdate)
						socketClient.socket.on(SOCKET_EVENT.GAMESTATE_COUNTDOWN_UPDATED, onCountdownUpdate)
						socketClient.socket.on(SOCKET_EVENT.PLAYER_NAME_UPDATED, onPlayerNameUpdate)
						socketClient.socket.on(SOCKET_EVENT.PLAYER_SCORE_UPDATED, onPlayerScoreUpdate)
						socketClient.socket.on(SOCKET_EVENT.PLAYER_ROOM_ORDER, onPlayerRoomOrder)
						socketClient.socket.on(SOCKET_EVENT.NODE_CONNECTED, onNodeConnected)
					} else if (res.status == 204) {
						socketError.current = "Oops! This invite code doesn't belong to any room.."
					}

					return res
				}).catch(() => {
					socketError.current = "We have encountered a problem on our side. Please try again later"
				})
		})()

		return () => {
			// Disconnect if server didn't cut the connection already
			if(socketClient.socket) {
				socketClient.socket.off("connect", onConnect)
				socketClient.socket.off("connect_error", onConnectError)
				socketClient.socket.off(SOCKET_EVENT.DATABASE_ERROR, onDatabaseError)
				socketClient.socket.off(SOCKET_EVENT.PLAYER_ERROR, onPlayerError)
				socketClient.socket.off(SOCKET_EVENT.GAMESTATE_BALL_POSITION_UPDATED, onBallPositionUpdate)
				socketClient.socket.off(SOCKET_EVENT.GAMESTATE_STATUS_UPDATED, onStatusUpdate)
				socketClient.socket.off(SOCKET_EVENT.GAMESTATE_COUNTDOWN_UPDATED, onCountdownUpdate)
				socketClient.socket.off(SOCKET_EVENT.PLAYER_NAME_UPDATED, onPlayerNameUpdate)
				socketClient.socket.off(SOCKET_EVENT.PLAYER_SCORE_UPDATED, onPlayerScoreUpdate)
				socketClient.socket.off(SOCKET_EVENT.PLAYER_ROOM_ORDER, onPlayerRoomOrder)
				socketClient.socket.off(SOCKET_EVENT.NODE_CONNECTED, onNodeConnected)

				dispatch(disconnectFromSocket())
			}

			dispatch(resetGameState())
		}
	}, [])

	if(socketError.current.length > 0) return <ErrorPage message={socketError.current}/>

	if (isLoading) return <LoadingScreen />

	return (
		<div className="flex flex-col items-center justify-center w-full h-full space-y-10 select-none dark:text-dark">
			{
				status == GAME_STATUS.WAITING ? (
					<WaitingPopup inviteCode={inviteCode}/>
				) : status == GAME_STATUS.STARTING ? (
					<CountdownPopup count={countdown}/>
				) : status == GAME_STATUS.SUSPENDED ? (
					<SuspensionPopup reason="Your opponent disconnected"/>
				) : status == GAME_STATUS.FINISHED ? (
					<FinishPopup winner={scoreboardRef.current[activePlayer].name} reason={finishMessage}/>
				) : <></>
			}

			<div style={{ width: scoreboardWidth }}>
				<div className="flex justify-between w-full font-strokedim">
					<div>
						<h1 className="text-3xl">{scoreboardRef.current[1].name} {scoreboardIndicatorLeft}</h1>
						<h2 className="text-xl">Score: {scoreboardRef.current[1].score}</h2>
					</div>

					<div className="flex flex-col items-end">
						<h1 className="text-3xl">{scoreboardIndicatorRight} {scoreboardRef.current[2].name}</h1>
						<h2 className="text-xl">Score: {scoreboardRef.current[2].score}</h2>
					</div>
				</div>

				<GameCanvas 
					isLoading={isLoading} 
					isConnected={socketError.current.length == 0}
					ownOrder={ownOrderRef.current}
					onWidth={setScoreboardWidth}
					onNodeClick={handleNodeClick}
				/>

				<div className="py-4 text-2xl text-center truncate font-crossedout" style={{ width: scoreboardWidth }}>
					{
						status == GAME_STATUS.ONGOING ? (
							activePlayer == ownOrderRef.current ? "It's your turn!" : `Wait for ${scoreboardRef.current[ownOrderRef.current == 1 ? 2 : 1].name}'s turn!`
						) : <></>
					}
				</div>
			</div>
		</div>
	)
}

export default GameScreen