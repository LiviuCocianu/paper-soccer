import { useCallback, useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams, useSearchParams } from "react-router-dom"
import { addHistoryMove, resetGameState, setActivePlayer, setBallPosition, setClientUsername, setCountdown, setGameMode, setHistory, setStatus, setWon } from "../state/slices/gameSlice"
import { GAME_MODE, GAME_STATUS, SOCKET_EVENT } from "../constants"

import LoadingScreen from "./LoadingScreen"
import ErrorPage from "./error/ErrorPage"
import GameScreenLayout from "../components/GameScreenLayout"

import { decodeQueryParam, fetchRequest } from "../utils"
import { connectToSocket, disconnectFromSocket } from "../state/slices/socketSlice"
import { socketClient } from "../main"
import sounds from "../sounds"


function OnlineGameScreen() {
	// Own state
	const { id: inviteCode } = useParams()
	const [ queryParams ] = useSearchParams()
	const [isLoading, toggleLoading] = useState(true)
	const [finishMessage, setFinishMessage] = useState("")
	const [toastMessage, setToastMessage] = useState("")

	const ownOrderRef = useRef(1)
	const modeRef = useRef(GAME_MODE.CLASSIC)
	const statusRef = useRef(GAME_STATUS.WAITING)

	const scoreboardRef = useRef({
		1: { name: "Player 1", score: 0 },
		2: { name: "Player 2", score: 0 }
	})

	// Web socket state
	const socketError = useRef("")

	// Redux state
	const { clientUsername, mode, status, won } = useSelector(state => state.game)
	const dispatch = useDispatch()

	const handleNodeClick = useCallback((node) => {
		socketClient.socket.emit(SOCKET_EVENT.NODE_CLICKED, inviteCode, ownOrderRef.current, node)
	}, [inviteCode, ownOrderRef])

	// Disconnect on socket error
	useEffect(() => {
		if(socketError.current.length > 0) {
			dispatch(disconnectFromSocket())
		}
	}, [socketError, dispatch])

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
		if(clientUsername.length > 0)
			scoreboardRef.current[ownOrderRef.current].name = clientUsername
	}, [clientUsername, ownOrderRef])

	// Setup: Handle socket connect/disconnect
	useEffect(() => {
		const onConnect = () => {
			toggleLoading(false)
		}

		const onDisconnect = () => {
			dispatch(resetGameState())
			if (socketError.current.length == 0)
				socketError.current = "We have encountered a connection problem on our side. Please try again later"
		}

		const onConnectError = () => {
			onDisconnect()
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
			dispatch(setWon(winner == ownOrderRef.current))

			/**
			 * In "best of 3" game mode, reset pitch if:
			 * - Ball cannot be moved
			 * - A goal was scored
			 * - One of the players' goalpost got blocked
			 */
			if (modeRef.current == GAME_MODE.BESTOF3 && (!canMove || inGoalpost || (!bounceable && (redBlocked || blueBlocked)))) {
				dispatch(setHistory({}))
			}

			if (!canMove || inGoalpost) {
				// Active player = winner
				// This player lost, so the other player will be set as the active one
				dispatch(setActivePlayer(winner))

				if (selfGoal) {
					if(modeRef.current == GAME_MODE.CLASSIC) {
						setFinishMessage(`${scoreboardRef.current[player].name} scored an own goal..`)
						return
					} else if (modeRef.current == GAME_MODE.BESTOF3) {
						setToastMessage(`${scoreboardRef.current[player].name} scored an own goal..`)
					}
				}

				if (inGoalpost) {
					if (modeRef.current == GAME_MODE.CLASSIC) {
						setFinishMessage(`Scored a goal for the ${inGoalpost == 1 ? "blue" : "red"} team!`)
						return
					} else if (modeRef.current == GAME_MODE.BESTOF3) {
						setToastMessage(`${scoreboardRef.current[winner].name} scored a goal for the ${winner == 1 ? "red" : "blue"} team! Scorer gets their turn first!`)
					}
				}

				if (!canMove) {
					if (modeRef.current == GAME_MODE.CLASSIC) {
						setFinishMessage(`${scoreboardRef.current[player].name} got the ball stuck`)
						return
					} else if (modeRef.current == GAME_MODE.BESTOF3) {
						setToastMessage(`${scoreboardRef.current[player].name} got the ball stuck`)
					}
				}
			}

			if (!bounceable) {
				dispatch(setActivePlayer(player == 1 ? 2 : 1))

				if (redBlocked || blueBlocked) {
					if (modeRef.current == GAME_MODE.CLASSIC) {
						setFinishMessage(`${scoreboardRef.current[winner].name} blocked their goalpost, not allowing for any further goals`)
						return
					} else if (modeRef.current == GAME_MODE.BESTOF3) {
						setToastMessage(`${scoreboardRef.current[winner].name} blocked their goalpost, not allowing for any further goals`)
					}
				}
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
						socketClient.socket.on("disconnect", onDisconnect)
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
				socketClient.socket.off("disconnect", onDisconnect)
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

	useEffect(() => {
		if(status == GAME_STATUS.FINISHED || status == GAME_STATUS.SUSPENDED) {
			if (won) sounds.winSound.play()
			else sounds.loseSound.play()
		}
	}, [status, won, sounds.loseSound, sounds.winSound])

	if (socketError.current.length > 0) return <ErrorPage message={socketError.current}/>

	if(import.meta.env.VITE_GITHUB_PAGES) return <ErrorPage message="This is a demo of the application, therefore multiplayer features have been disabled!"/>

	if (isLoading) return <LoadingScreen />

	return (
		<GameScreenLayout 
			multiplayer
			inviteCode={inviteCode}
			order={ownOrderRef.current}
			isLoading={isLoading}
			isConnected={socketError.current.length == 0}
			scoreboard={scoreboardRef.current}
			onNodeClick={handleNodeClick}
			finishMessage={finishMessage}
			toastText={toastMessage}
			setToastText={setToastMessage}
		/>
	)
}

export default OnlineGameScreen