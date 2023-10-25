import { Link, useRouteError } from "react-router-dom"
import ThemeSwitch from "../../components/ThemeSwitch"

function ErrorPage({ message }) {
	const error = useRouteError()

	return (
		<div className="flex flex-col items-center justify-center w-full h-full space-y-10 select-none dark:text-dark bg-[url('/images/paper-light.png')] dark:bg-[url('/images/paper-dark.png')]">
			<ThemeSwitch/>

			<div className="flex flex-col items-center justify-center m-4 space-y-2">
				<h1 className="text-2xl text-center md:text-4xl font-crossedout">Something went wrong</h1>
				<h2 className="text-xl text-center md:text-2xl font-heycomic">{message ? message : error.data}</h2>
			</div>

			<Link to={`${import.meta.env.ROOT_ROUTE}/`} className="text-xl md:text-2xl font-strokedim"><i>- Return to main menu -</i></Link>
		</div>
	)
}

export default ErrorPage