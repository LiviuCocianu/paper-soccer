import { useEffect } from "react"
import { Link } from "react-router-dom"
import sounds from "../sounds.js"

function HomeScreen() {
	useEffect(() => {
		document.title = "Play \"Paper Soccer\""
	}, [])

	const handleButtonClick = () => {
		sounds.buttonSound.play()
	}

	return (
		<div className="flex items-center justify-center w-full h-full animate-fadingIn">
			<div className="flex flex-col mx-6 space-y-6 select-none dark:text-dark">
				<h1 className="text-4xl text-center font-crossedout md:text-7xl">Paper Soccer</h1>

				<div className="flex flex-col items-center justify-around space-y-4 text-2xl font-bold md:space-y-0 md:flex-row font-strokedim dark:font-normal">
					<HomeButton text="Play with bot" path={import.meta.env.ROOT_ROUTE + "/singleplayer"} onClick={handleButtonClick} />
					<HomeButton text="Play with someone" path={import.meta.env.ROOT_ROUTE + "/multiplayer"} onClick={handleButtonClick} />
				</div>
			</div>
		</div>
	)
}

const HomeButton = ({ text, path=`${import.meta.env.ROOT_ROUTE}/`, onClick }) => {
	return <Link to={path} className="w-full h-full p-2 px-6 text-center border-2 border-black rounded-lg md:w-auto dark:border-dark hover:border-dashed" onClick={onClick}>{text}</Link>
}

export default HomeScreen