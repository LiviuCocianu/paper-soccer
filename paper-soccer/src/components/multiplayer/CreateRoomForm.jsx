import { useState } from "react";
import TickIcon from "../../assets/icons/TickIcon";
import SubmitButton from "./SubmitButton";

function CreateRoomForm() {
	const [gamemode, setGamemode] = useState("classic");

	const selectGamemode = (e) => {
		const gm = e.currentTarget.dataset.gamemode;

		if (gm == "Classic") setGamemode("classic")
		else if (gm == "Best of 3") setGamemode("bestof3");
	}

	return (
		<div className="flex flex-col p-10 border-2 border-black dark:border-dark px-14 rounded-2xl">
			<h1 className="text-5xl font-crossedout">Create a room</h1>
			<h2 className="text-2xl font-bold font-strokedim dark:font-normal">Choose a game mode</h2>

			<div className="w-full mt-6 space-y-2">
				<GamemodeButton
					title="Classic"
					desc="First to score a goal wins"
					onClick={selectGamemode}
					checked={gamemode == "classic"} />

				<GamemodeButton
					title="Best of 3"
					desc="Whoever scored the most amount of goals out of 3 wins"
					onClick={selectGamemode}
					checked={gamemode == "bestof3"} />
			</div>

			<SubmitButton text="Create" />
		</div>
	)
}

const GamemodeButton = ({ title, desc, checked, onClick }) => {
	return (
		<div data-gamemode={title} className="border border-black dark:border-dark pl-8 pr-2 py-2 min-h-20 cursor-pointer grid gap-x-2 items-center grid-cols-[minmax(auto,calc(100%-4rem)),4rem]" onClick={onClick}>
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