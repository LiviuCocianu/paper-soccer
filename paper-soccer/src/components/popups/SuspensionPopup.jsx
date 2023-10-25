import { Link } from "react-router-dom"
import OpacityIcon from "../../assets/icons/OpacityIcon"
import { useState } from "react"

function SuspensionPopup({ reason="" }) {
	const [opacity, toggleOpacity] = useState(false)

	const handleOpacity = () => {
		toggleOpacity(!opacity)
	}

	return (
		<div className="absolute flex items-center justify-center w-full h-full bg-black/50">
			<div className={`relative w-[90%] md:w-[40rem] aspect-square md:aspect-video bg-[url('/images/paper-light.png')] dark:bg-[url('/images/paper-dark.png')] flex flex-col items-center justify-center rounded-xl${opacity ? " opacity-50" : ""}`}>
				<div className="flex flex-col items-center justify-center space-y-4">
					<OpacityIcon className="absolute w-6 cursor-pointer fill-black right-4 top-4 dark:fill-dark" onClick={handleOpacity} />

					<h1 className="text-3xl md:text-5xl font-crossedout">Game canceled</h1>
					<h2 className="text-xl md:text-2xl font-strokedim">{reason}</h2>
					
					<Link to={`${import.meta.env.ROOT_ROUTE}/`} className="absolute font-bold bottom-4 md:bottom-10 font-strokedim dark:font-normal"><i>- Return to main menu -</i></Link>
				</div>
			</div>
		</div>
	)
}

export default SuspensionPopup