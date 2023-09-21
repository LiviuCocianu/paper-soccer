import { Outlet, useLocation } from "react-router-dom"
import ThemeSwitch from "./components/ThemeSwitch"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { disconnectFromSocket } from "./state/slices/socketSlice"

function App() {
	const location = useLocation()
	const socketStatus = useSelector(state => state.socket.status)
	const dispatch = useDispatch()

	// Disconnect socket if player leaves the game route
	useEffect(() => {
		if (socketStatus == "connected" && !location.pathname.startsWith("/game/")) {
			dispatch(disconnectFromSocket())
		}
	}, [socketStatus, location])

	return (
		<div className="w-full h-full bg-[url('/images/paper-light.png')] dark:bg-[url('/images/paper-dark.png')] bg-cover selection:bg-gray-400 selection:dark:bg-dark selection:dark:text-black">
			<ThemeSwitch/>

			{/* Anything else in the application */}
			<Outlet/>
		</div>
	)
}

export default App