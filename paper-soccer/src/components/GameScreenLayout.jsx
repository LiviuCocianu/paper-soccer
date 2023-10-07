import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { Howl } from 'howler';

import { GAME_STATUS } from "../constants"

import GameCanvas from "./GameCanvas"
import CountdownPopup from "./popups/CountdownPopup"
import FinishPopup from "./popups/FinishPopup"
import SuspensionPopup from "./popups/SuspensionPopup"
import WaitingPopup from "./popups/WaitingPopup"

function GameScreenLayout({ 
	multiplayer=false, 
	inviteCode,
	order=1,
	isLoading,
	isConnected,
	scoreboard,
	onNodeClick,
	finishMessage
}) {
	// Client & server game state
	const { status, activePlayer, ballPosition } = useSelector(state => state.game)
	// Client only game state
	const { countdown, won } = useSelector(state => state.game)

	const [scoreboardWidth, setScoreboardWidth] = useState(0)

	const startedSound = useMemo(() => new Howl({
		src: ['./sounds/started.mp3'],
		volume: 0.5
	}), [])

	const moveSound = useMemo(() => new Howl({
		src: ['./sounds/move.mp3'],
		volume: 0.5
	}), [])

	const scoreboardIndicatorLeft = useMemo(() => {
		return order == 1 && multiplayer ? (<span className="text-xl font-heycomic">(you)</span>) : ""
	}, [order, multiplayer])

	const scoreboardIndicatorRight = useMemo(() => {
		return order == 2 && multiplayer ? (<span className="text-xl font-heycomic">(you)</span>) : ""
	}, [order, multiplayer])

	const winnerDisplayName = useMemo(() => {
		return !multiplayer ? (won ? "You" : "Bot") : (scoreboard[activePlayer].name)
	}, [activePlayer, scoreboard, won, multiplayer])

	const basePopups = useMemo(() => {
		return status == GAME_STATUS.STARTING ? (
			<CountdownPopup count={countdown} />
		) : status == GAME_STATUS.FINISHED ? (
			<FinishPopup winner={winnerDisplayName} reason={finishMessage} />
		) : <></>
	}, [status, countdown, finishMessage, winnerDisplayName])

	const extraPopups = useMemo(() => {
		if(!inviteCode) return <></>
		return status == GAME_STATUS.WAITING ? (
			<WaitingPopup inviteCode={inviteCode} />
		) : status == GAME_STATUS.SUSPENDED ? (
			<SuspensionPopup reason="Your opponent disconnected" />
		) : <></>
	}, [status, inviteCode])

	const subtitle = useMemo(() => {
		return !multiplayer ? (
			activePlayer == 1 && status == GAME_STATUS.ONGOING ? "It's your turn" : <wbr/>
		) : (
			status == GAME_STATUS.ONGOING ? (
				activePlayer == order ? "It's your turn!" : `Wait for ${scoreboard[order == 1 ? 2 : 1].name}'s turn!`
			) : <></>
		)
	}, [status, activePlayer, order, scoreboard, multiplayer])

	// Sound effects
	useEffect(() => {
		if(status == GAME_STATUS.ONGOING) startedSound.play()
	}, [status, startedSound])

	useEffect(() => {
		if (status == GAME_STATUS.ONGOING && ((!multiplayer && activePlayer == 1) || multiplayer)) {
			moveSound.play()
		}
	}, [status, ballPosition, activePlayer, multiplayer, moveSound])

	return (
		<div className="flex flex-col items-center justify-center w-full h-full space-y-10 select-none dark:text-dark">
			{ basePopups }
			{ multiplayer ? extraPopups : <></> }

			<div style={{ width: scoreboardWidth }}>
				<div className="flex justify-between w-full font-strokedim">
					<div>
						<h1 className="text-3xl">{scoreboard[1].name} {scoreboardIndicatorLeft}</h1>
						<h2 className="text-xl">Score: {scoreboard[1].score}</h2>
					</div>

					<div className="flex flex-col items-end">
						<h1 className="text-3xl">{scoreboardIndicatorRight} {scoreboard[2].name}</h1>
						<h2 className="text-xl">Score: {scoreboard[2].score}</h2>
					</div>
				</div>

				<GameCanvas
					isLoading={isLoading}
					isConnected={isConnected}
					ownOrder={order}
					onWidth={setScoreboardWidth}
					onNodeClick={onNodeClick}
				/>

				<div className="py-4 text-2xl text-center truncate font-crossedout" style={{ width: scoreboardWidth }}>
					{subtitle}
				</div>
			</div>
		</div>
	)
}

export default GameScreenLayout