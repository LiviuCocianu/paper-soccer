import { Link } from "react-router-dom"

function Home() {
	return (
		<div className="flex items-center justify-center w-full h-full animate-fadingIn">
			<div className="flex flex-col space-y-6 select-none dark:text-dark">
				<h1 className="font-crossedout text-7xl">Paper Soccer</h1>

				<div className="flex flex-row justify-around text-2xl font-bold font-strokedim dark:font-normal">
					<HomeButton text="Play with bot"/>
					<HomeButton text="Play with someone" path="/multiplayer"/>
				</div>
			</div>
		</div>
	)
}

const HomeButton = ({ text, path="/" }) => {
	return <Link to={path} className="p-2 px-6 border-2 border-black rounded-lg dark:border-dark hover:border-dashed">{text}</Link>
}

export default Home