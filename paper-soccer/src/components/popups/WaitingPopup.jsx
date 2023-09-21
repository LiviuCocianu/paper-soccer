import { useRef, useState } from "react"
import CopyIcon from "../../assets/icons/CopyIcon"

function WaitingPopup({ inviteCode }) {
	const copyRef = useRef(null)
	const [copyTextShown, setCopyTextShown] = useState(false)

	const copyInviteCode = () => {
		navigator.clipboard.writeText(inviteCode)

		if(!copyTextShown) {
			copyRef.current.classList.remove("opacity-0")
			setCopyTextShown(true)

			setTimeout(() => {
				copyRef.current.classList.add("opacity-0")
				setCopyTextShown(false)
			}, 1000 * 3)
		}
	}

	return (
		<div className="absolute flex items-center justify-center w-full h-full bg-black/50">
			<div className="w-[40rem] aspect-video bg-[url('/images/paper-light.png')] dark:bg-[url('/images/paper-dark.png')] flex flex-col space-y-10 items-center justify-center rounded-xl">
				<div className="flex flex-col items-center justify-center space-y-2 font-bold dark:font-normal font-strokedim">
					<h1 className="text-5xl">Waiting for opponent...</h1>
					<h2 className="mx-20 text-2xl text-center">Give this invite code to your friend or give them the link to this page!</h2>
				</div>

				<div className="relative flex flex-col items-center justify-center space-y-2 font-heycomic">
					<div className="flex space-x-2">
						<h3 className="text-4xl select-text">{inviteCode}</h3>
						<CopyIcon className="w-6 cursor-pointer fill-black dark:fill-gray-400" onClick={copyInviteCode} />
					</div>

					<p ref={copyRef} className="absolute text-green-500 transition-opacity translate-y-10 opacity-0">Copied to clipboard!</p>
				</div>
			</div>
		</div>
	)
}

export default WaitingPopup