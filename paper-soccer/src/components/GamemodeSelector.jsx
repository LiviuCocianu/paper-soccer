import { GAME_MODE } from "../constants"
import TickIcon from "../assets/icons/TickIcon"
import sounds from "../sounds"

function GamemodeSelector({ className, gamemode, setGamemode }) {
	const selectGamemode = (e) => {
		const gm = e.currentTarget.dataset.gamemode
		if (gm) setGamemode(gm)

		sounds.radioButtonSound.play()
	}

	return (
		<div className={`w-full ${className}`}>
			<GamemodeButton
				id={GAME_MODE.CLASSIC}
				title="Classic"
				desc="First to score a goal wins"
				onClick={selectGamemode}
				checked={gamemode == GAME_MODE.CLASSIC} />

			<GamemodeButton
				id={GAME_MODE.BESTOF3}
				title="Best of 3"
				desc="Whoever scored the most amount of goals out of 3 wins"
				onClick={selectGamemode}
				checked={gamemode == GAME_MODE.BESTOF3} />
		</div>
	)
}

const GamemodeButton = ({ id, title, desc, checked, onClick }) => {
	return (
		<div data-gamemode={id} className="border border-black dark:border-dark pl-8 pr-2 py-2 min-h-20 cursor-pointer grid gap-x-2 items-center grid-cols-[minmax(auto,calc(100%-4rem)),4rem]" onClick={onClick}>
			<div>
				<h3 className="text-2xl font-bold font-strokedim dark:font-normal">{title}</h3>
				<h4 className="text-sm font-heycomic">{desc}</h4>
			</div>

			<div className="h-full aspect-square justify-self-end">
				{checked ? <TickIcon className="w-12 dark:fill-dark" /> : <></>}
			</div>
		</div>
	)
}

export default GamemodeSelector