import { useState } from "react"
import InputField from "../InputField"
import NameField from "../NameField"
import SubmitButton from "../SubmitButton"
import { fetchRequest } from "../../utils"
import { setClientUsername } from "../../state/slices/gameSlice"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"

function JoinRoomForm({ errorHandler }) {
	const [inviteCode, setInviteCode] = useState("")
	const [username, setUsername] = useState("")
	const [submitDisabled, setSubmitDisabled] = useState(false)
	const [fieldError, setFieldError] = useState("")

	const dispatch = useDispatch()
	const navigate = useNavigate()

	const changeInviteCode = (e) => {
		if(fieldError.length > 0) setFieldError("")
		setInviteCode(e.target.value)
	}

	const changeUsername = (e) => {
		if (fieldError.length > 0) setFieldError("")
		setUsername(e.target.value)
	}

	const sendForm = async () => {
		if (!submitDisabled) {
			if(inviteCode.length != 8) {
				setFieldError("Invalid invite code: invalid code length")
				return
			}

			setSubmitDisabled(true)

			await fetchRequest("/api/rooms/" + inviteCode, "GET")
				.then(res => {
					if(res.status == 204) {
						setFieldError("Invalid invite code: no such room with this invite")
						setSubmitDisabled(false)
						return undefined
					}

					return res.json()
				}).then(res => {
					if(res && res.result) {
						setFieldError("")
						setSubmitDisabled(false)
						dispatch(setClientUsername(username))
						navigate("/game/" + inviteCode)
					}
				}).catch(err => {
					errorHandler(err.message)
				})
		}
	}

	return (
		<div className="flex flex-col p-10 border-2 border-black dark:border-dark px-14 rounded-2xl animate-fadingIn">
			<h1 className="text-5xl font-crossedout">Join a room</h1>

			<div className="flex flex-col w-[25rem] mt-6 space-y-4">
				<InputField onChange={changeInviteCode} placeholder="Insert your invite code" required maxLength={8} pattern="^[a-zA-Z0-9]{8}$"/>
				<NameField onChange={changeUsername}/>

				{
					fieldError.length > 0 ? (
						<div className="text-center text-red-900 font-heycomic dark:text-red-300 w-[25rem]">{fieldError}</div>
					) : <></>
				}
			</div>

			<SubmitButton text="Join" disabled={submitDisabled} onClick={sendForm} loadingColors="fill-white dark:fill-black" />
		</div>
	)
}

export default JoinRoomForm