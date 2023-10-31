import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { disconnectFromSocket } from "./state/slices/socketSlice"
import { init as initSounds } from "./sounds"
import { MULTIPLAYER_ROUTE } from "./constants"

import { Outlet, useLocation } from "react-router-dom"
import ThemeSwitch from "./components/ThemeSwitch"

function App() {
	const location = useLocation()
	const socketStatus = useSelector(state => state.socket.status)
	const dispatch = useDispatch()

	// Init sounds on UI render
	useEffect(() => {
		initSounds()
	}, [])

	// Disconnect socket if player leaves the game route
	useEffect(() => {
		if (socketStatus == "connected" && !location.pathname.startsWith(MULTIPLAYER_ROUTE)) {
			dispatch(disconnectFromSocket())
		}
	}, [socketStatus, location])

	return (
		<div className="flex justify-center w-full h-full bg-[url('/images/paper-light.png')] dark:bg-[url('/images/paper-dark.png')] bg-cover selection:bg-gray-400 selection:dark:bg-dark selection:dark:text-black">
			<ThemeSwitch/>

			{/* Anything else in the application */}
			<Outlet/>

			{
				import.meta.env.VITE_GITHUB_PAGES ? (
					<h2 className="absolute bottom-0 right-0 m-4 select-none text-md md:text-xl font-heycomic dark:text-dark">Github Pages DEMO version</h2>
				) : <></>
			}
		</div>
	)
}

export default App