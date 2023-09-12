import { useState } from "react"
import CreateRoomForm from "./multiplayer/CreateRoomForm"
import JoinRoomForm from "./multiplayer/JoinRoomForm"

function MultiplayerScreen() {
	const [createForm, toggleForm] = useState(true);

	const changeForm = () => {
		toggleForm(!createForm)
	};

	return (
		<div className="flex flex-col items-center justify-center w-full h-full space-y-10 select-none dark:text-dark">
			{createForm ? <CreateRoomForm /> : <JoinRoomForm/>}
			<div className="text-4xl font-heycomic">
				...or <u className="cursor-pointer" onClick={changeForm}>{createForm ? "join a room" : "create a room"}</u>
			</div>
		</div>
	)
}

export default MultiplayerScreen