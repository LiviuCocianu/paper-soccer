import { useState } from "react"
import SubmitButton from "../SubmitButton"
import NameField from "../NameField"
import { GAME_MODE } from "../../constants"
import { useNavigate } from "react-router-dom"
import { fetchRequest } from "../../utils"
import { useDispatch } from "react-redux"
import { setClientUsername } from "../../state/slices/gameSlice"
import GamemodeSelector from "../GamemodeSelector"
import sounds from "../../sounds"


function CreateRoomForm({ errorHandler }) {
	const [gameMode, setGamemode] = useState(GAME_MODE.CLASSIC)
	const [username, setUsername] = useState("")
	const [submitDisabled, setSubmitDisabled] = useState(false)
	const dispatch = useDispatch()
	const navigate = useNavigate()

	const changeUsername = (e) => setUsername(e.target.value)

	const sendForm = async () => {
		if(!submitDisabled) {
			setSubmitDisabled(true)

			sounds.buttonSound.play()

			await fetchRequest("/api/rooms/", "POST", { gameMode } )
				.then(res => res.json())
				.then(res => {
					setSubmitDisabled(false)
					dispatch(setClientUsername(username))
					navigate("/multiplayer/game/" + res.posted.inviteCode)
				}).catch(err => {
					errorHandler(err.message)
				})
		}
	}

	return (
		<div className="flex flex-col p-10 px-8 space-y-8 md:border-2 md:border-black md:dark:border-dark md:px-14 rounded-2xl animate-fadingIn">
			<div>
				<h1 className="text-3xl md:text-5xl font-crossedout">Create a room</h1>
				<h2 className="text-xl font-bold md:text-2xl font-strokedim dark:font-normal">Choose a game mode</h2>
			</div>

			<GamemodeSelector 
				gamemode={gameMode} 
				setGamemode={setGamemode} 
				className="space-y-2"/>

			<NameField value={username} onChange={changeUsername}/>

			<SubmitButton text="Create" loadingColors="fill-white dark:fill-black" onClick={sendForm} disabled={submitDisabled} />
		</div>
	)
}

export default CreateRoomForm