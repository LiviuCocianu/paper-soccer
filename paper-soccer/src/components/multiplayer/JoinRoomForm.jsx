import SubmitButton from "./SubmitButton"

function JoinRoomForm() {


	return (
		<div className="flex flex-col p-10 border-2 border-black dark:border-dark px-14 rounded-2xl">
			<h1 className="text-5xl font-crossedout">Join a room</h1>

			<div className="flex flex-col mt-6 space-y-4">
				<InputField placeholder="Insert your invite code" required maxLength={8} pattern="^[a-zA-Z0-9]{8}$"/>
				<InputField placeholder="Choose a name (optional)" maxLength={16} pattern="[\w\s]+"/>
			</div>

			<SubmitButton text="Join" />
		</div>
	)
}

const InputField = (props) => {
	return (
		<div className="relative w-full h-full">
			<div className="absolute w-full h-full translate-x-1 translate-y-1 bg-black dark:bg-dark"/>
			<input className="relative w-full p-2 border border-black dark:border-dark dark:bg-nightsky focus:outline-0 font-heycomic" type="text" {...props} spellCheck={false}/>
		</div>
	)
}

export default JoinRoomForm