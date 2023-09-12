import { Link } from "react-router-dom"

function Home() {
	return (
		<div className="w-full h-full flex justify-center items-center">
			<div className="flex flex-col select-none dark:text-dark">
				<h1 className="font-crossedout text-7xl">Paper Soccer</h1>

				<div className="flex flex-row font-strokedim text-2xl mt-4 justify-around font-bold dark:font-normal">
					<HomeButton text="Play with bot"/>
					<HomeButton text="Play with someone" path="/multiplayer"/>
				</div>
			</div>
		</div>
	)
}

const HomeButton = ({ text, path="/" }) => {
	return <Link to={path} className="border-2 border-black dark:border-dark p-2 px-6 rounded-lg hover:border-dashed">{text}</Link>
}

export default Home