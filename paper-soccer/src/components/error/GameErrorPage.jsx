import { Link } from "react-router-dom"

function GameErrorPage() {
	return (
		<div className="flex flex-col items-center justify-center w-full h-full space-y-10 select-none dark:text-dark">
			<div className="flex flex-col space-y-2">
				<h1 className="text-4xl font-crossedout">Looks like you&apos;re lost</h1>
				<h2 className="text-2xl font-strokedim">There is nothing to see here, move along please!</h2>
			</div>
			
			<Link to="/" className="text-2xl font-strokedim"><i>- Return to main menu -</i></Link>
		</div>
	)
}

export default GameErrorPage