import { Outlet } from "react-router-dom"
import ThemeSwitch from "./ThemeSwitch"

function App() {
	return (
		<div className="w-full h-full bg-[url('/images/paper-light.png')] dark:bg-[url('/images/paper-dark.png')] bg-cover selection:bg-gray-400 selection:dark:bg-dark selection:dark:text-black">
			<ThemeSwitch/>

			{/* Anything else in the application */}
			<Outlet/>
		</div>
	)
}

export default App