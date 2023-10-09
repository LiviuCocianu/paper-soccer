import { useEffect, useState } from "react"
import CreateRoomForm from "../components/multiplayer/CreateRoomForm"
import JoinRoomForm from "../components/multiplayer/JoinRoomForm"
import ErrorPage from "../screens/error/ErrorPage"

function MultiplayerScreen() {
	const [createForm, toggleForm] = useState(true)
	const [errorMessage, setErrorMessage] = useState("")

	useEffect(() => {
		document.title = "Paper Soccer - Multiplayer"
	}, [])

	const changeForm = () => {
		toggleForm(!createForm)
	}

	if (errorMessage.length > 0) return <ErrorPage message={errorMessage} />

	return (
		<div className="flex flex-col items-center justify-center w-full h-full space-y-10 select-none dark:text-dark">
			{createForm 
				? <CreateRoomForm errorHandler={setErrorMessage} /> 
				: <JoinRoomForm errorHandler={setErrorMessage} />
			}
			
			<div className="text-4xl font-heycomic">
				...or <u className="cursor-pointer" onClick={changeForm}>{createForm ? "join a room" : "create a room"}</u>
			</div>
		</div>
	)
}

export default MultiplayerScreen