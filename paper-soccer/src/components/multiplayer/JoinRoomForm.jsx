import InputField from "../InputField"
import NameField from "./NameField"
import SubmitButton from "./SubmitButton"

function JoinRoomForm({ errorHandler }) {
	return (
		<div className="flex flex-col p-10 border-2 border-black dark:border-dark px-14 rounded-2xl animate-fadingIn">
			<h1 className="text-5xl font-crossedout">Join a room</h1>

			<div className="flex flex-col mt-6 space-y-4">
				<InputField placeholder="Insert your invite code" required maxLength={8} pattern="^[a-zA-Z0-9]{8}$"/>
				<NameField/>
			</div>

			<SubmitButton text="Join" />
		</div>
	)
}

export default JoinRoomForm