import { Link, useRouteError } from "react-router-dom"
import ThemeSwitch from "../ThemeSwitch";

function ErrorPage() {
	const error = useRouteError();

	return (
		<div className="flex flex-col items-center justify-center w-full h-full space-y-10 select-none dark:text-dark bg-[url('/images/paper-light.png')] dark:bg-[url('/images/paper-dark.png')]">
			<ThemeSwitch/>

			<div className="flex flex-col items-center space-y-2">
				<h1 className="text-4xl font-crossedout">Something went wrong</h1>
				<h2 className="text-2xl font-heycomic">{error.data}</h2>
			</div>

			<Link to="/" className="text-2xl font-strokedim"><i>- Return to main menu -</i></Link>
		</div>
	)
}

export default ErrorPage