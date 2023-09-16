import { useState } from "react";
import TickIcon from "../../assets/icons/TickIcon";
import SubmitButton from "./SubmitButton";
import NameField from "./NameField";
import { GAME_MODE } from "../../constants";

function CreateRoomForm() {
	const [gamemode, setGamemode] = useState(GAME_MODE.CLASSIC);
	const [username, setUsername] = useState("");

	const selectGamemode = (e) => {
		const gm = e.currentTarget.dataset.gamemode;
		if(gm) setGamemode(gm)
	}

	const changeUsername = (e) => setUsername(e.target.value)

	return (
		<div className="flex flex-col p-10 space-y-6 border-2 border-black dark:border-dark px-14 rounded-2xl animate-fadingIn">
			<div>
				<h1 className="text-5xl font-crossedout">Create a room</h1>
				<h2 className="text-2xl font-bold font-strokedim dark:font-normal">Choose a game mode</h2>
			</div>

			<div className="w-full space-y-2">
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

			<NameField value={username} onChange={changeUsername}/>

			<SubmitButton text="Create" />
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

export default CreateRoomForm