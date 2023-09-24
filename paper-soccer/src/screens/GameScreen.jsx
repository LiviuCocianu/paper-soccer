import { useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams } from "react-router-dom"
import { resetGameState, setCountdown, setStatus } from "../state/slices/gameSlice"
import { GAME_STATUS, SOCKET_EVENT } from "../constants"

import WaitingPopup from "../components/popups/WaitingPopup"
import CountdownPopup from "../components/popups/CountdownPopup"
import LoadingScreen from "./LoadingScreen"
import ErrorPage from "../screens/error/ErrorPage"
import SuspensionPopup from "../components/popups/SuspensionPopup"
import GameCanvas from "../components/GameCanvas"

import { fetchRequest } from "../utils"
import { connectToSocket, disconnectFromSocket } from "../state/slices/socketSlice"
import { socketClient } from "../main"


function GameScreen() {
	// Own state
	const { id: inviteCode } = useParams()
	const [isLoading, toggleLoading] = useState(true)
	const [ownOrder, setOwnOrder] = useState(1)

	const [scoreboardWidth, setScoreboardWidth] = useState(0)
	const scoreboardIndicatorLeft = useMemo(() => {
		return ownOrder == 1 ? (<span className="text-xl font-heycomic">(you)</span>) : ""
	}, [ownOrder])
	const scoreboardIndicatorRight = useMemo(() => {
		return ownOrder == 2 ? (<span className="text-xl font-heycomic">(you)</span>) : ""
	}, [ownOrder])

	const [scoreboard, setScoreboard] = useState({
		1: { name: "Player", score: 0 }, 
		2: { name: "Player", score: 0 }
	})

	// Web socket state
	const socketError = useRef("")

	// Redux state
	const { clientUsername, activePlayer, status, countdown } = useSelector(state => state.game)
	const dispatch = useDispatch()

	// Disconnect on socket error
	useEffect(() => {
		dispatch(disconnectFromSocket())
	}, [socketError.current])

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

		const onStatusUpdate = (statusFromSocket, ack) => {
			dispatch(setStatus(statusFromSocket))
			if (ack) ack()
		}

		const onCountdownUpdate = (valueFromSocket, ack) => {
			dispatch(setCountdown(valueFromSocket))
			if (ack) ack()
		}

		const onPlayerNameUpdate = (orderNoFromSocket, nameFromSocket) => {
			setScoreboard(prev => ({
				...prev,
				[orderNoFromSocket]: {
					...prev[orderNoFromSocket],
					name: nameFromSocket
				}
			}))
		}

		const onPlayerScoreUpdate = (orderNoFromSocket, scoreFromSocket) => {
			setScoreboard(prev => ({
				...prev,
				[orderNoFromSocket]: {
					...prev[orderNoFromSocket],
					score: scoreFromSocket
				}
			}))
		}

		const onPlayerRoomOrder = (orderNoFromSocket) => {
			setOwnOrder(orderNoFromSocket)
		}

		(async () => {
			// Only connect if invite code in route is valid
			await fetchRequest("/api/rooms/" + inviteCode)
				.then(async res => {
					if (res.status == 200) {
						dispatch(connectToSocket({ room: inviteCode, username: clientUsername }))

						socketClient.socket.on("connect", onConnect)
						socketClient.socket.on("disconnect", onConnectError)
						socketClient.socket.on("connect_error", onConnectError)
						socketClient.socket.on(SOCKET_EVENT.DATABASE_ERROR, onDatabaseError)
						socketClient.socket.on(SOCKET_EVENT.PLAYER_ERROR, onPlayerError)
						socketClient.socket.on(SOCKET_EVENT.GAMESTATE_STATUS_UPDATED, onStatusUpdate)
						socketClient.socket.on(SOCKET_EVENT.GAMESTATE_COUNTDOWN_UPDATED, onCountdownUpdate)
						socketClient.socket.on(SOCKET_EVENT.PLAYER_NAME_UPDATED, onPlayerNameUpdate)
						socketClient.socket.on(SOCKET_EVENT.PLAYER_SCORE_UPDATED, onPlayerScoreUpdate)
						socketClient.socket.on(SOCKET_EVENT.PLAYER_ROOM_ORDER, onPlayerRoomOrder)
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
				socketClient.socket.off(SOCKET_EVENT.GAMESTATE_STATUS_UPDATED, onStatusUpdate)
				socketClient.socket.off(SOCKET_EVENT.GAMESTATE_COUNTDOWN_UPDATED, onCountdownUpdate)
				socketClient.socket.off(SOCKET_EVENT.PLAYER_NAME_UPDATED, onPlayerNameUpdate)
				socketClient.socket.off(SOCKET_EVENT.PLAYER_SCORE_UPDATED, onPlayerScoreUpdate)
				socketClient.socket.off(SOCKET_EVENT.PLAYER_ROOM_ORDER, onPlayerRoomOrder)

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
				) : <></>
			}

			<div className={`w-[${scoreboardWidth}]`}>
				<div className="flex justify-between w-full font-strokedim">
					<div>
						<h1 className="text-3xl">{scoreboard[1].name} {scoreboardIndicatorLeft}</h1>
						<h2 className="text-xl">Score: {scoreboard[1].score}</h2>
					</div>

					<div className={`flex flex-col items-end`}>
						<h1 className="text-3xl">{scoreboardIndicatorRight} {scoreboard[2].name}</h1>
						<h2 className="text-xl">Score: {scoreboard[2].score}</h2>
					</div>
				</div>

				<GameCanvas 
					isLoading={isLoading} 
					isConnected={socketError.current.length == 0}
					ownOrder={ownOrder}
					onWidth={setScoreboardWidth}
				/>

				<div className={`w-[${scoreboardWidth}] font-crossedout text-2xl text-center py-4`}>
					{activePlayer == ownOrder ? "It's your turn!" : `Wait for ${scoreboard[ownOrder == 1 ? 2 : 1].name}'s turn!`}
				</div>
			</div>
		</div>
	)
}

export default GameScreen