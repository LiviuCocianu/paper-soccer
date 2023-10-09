import ReactDOM from 'react-dom/client'
import '../index.css'

import { Provider } from 'react-redux'
import { store } from './state/store'
import SocketClient from "./state/SocketClient.js"

import {
	createBrowserRouter,
	createRoutesFromElements,
	RouterProvider,
	Route
} from "react-router-dom"

// Screens
import App from './App'
import HomeScreen from './screens/HomeScreen'
import MultiplayerScreen from './screens/MultiplayerScreen'
import ErrorPage from './screens/error/ErrorPage'
import GameErrorPage from './screens/error/GameErrorPage'
import OnlineGameScreen from './screens/OnlineGameScreen'
import SingleplayerScreen from './screens/SingleplayerScreen'

export const socketClient = new SocketClient()

const router = createBrowserRouter(createRoutesFromElements(
	<Route path="/" element={<App/>} errorElement={<ErrorPage/>}>
		<Route element={<HomeScreen />} index/>
		<Route path="/singleplayer" element={<SingleplayerScreen />} errorElement={<ErrorPage />} />
		<Route path="/multiplayer" element={<MultiplayerScreen />} errorElement={<ErrorPage />} />
		<Route path="/multiplayer/game" element={<GameErrorPage/>}/>
		<Route path="/multiplayer/game/:id" element={<OnlineGameScreen />} errorElement={<ErrorPage/>} />
	</Route>
))

ReactDOM.createRoot(document.getElementById('root')).render(
	<Provider store={store}>
		<RouterProvider router={router}/>
	</Provider>,
)
