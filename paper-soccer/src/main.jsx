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
import { MULTIPLAYER_ROUTE } from './constants'
import OfflineGameScreen from './screens/OfflineGameScreen'

export const socketClient = new SocketClient()

const router = createBrowserRouter(createRoutesFromElements(
	<Route path={`/`} element={<App/>} errorElement={<ErrorPage/>}>
		<Route path={`${import.meta.env.VITE_ROOT_ROUTE}/`} element={<HomeScreen />} index/>
		<Route path={`${import.meta.env.VITE_ROOT_ROUTE}/singleplayer`} element={<SingleplayerScreen />} errorElement={<ErrorPage />} />
		<Route path={`${import.meta.env.VITE_ROOT_ROUTE}/singleplayer/game`} element={<OfflineGameScreen/>} errorElement={<ErrorPage />} />

		<Route path={`${import.meta.env.VITE_ROOT_ROUTE}/multiplayer`} element={<MultiplayerScreen />} errorElement={<ErrorPage />} />
		<Route path={`${import.meta.env.VITE_ROOT_ROUTE + MULTIPLAYER_ROUTE}`} element={<GameErrorPage/>}/>
		<Route path={`${import.meta.env.VITE_ROOT_ROUTE + MULTIPLAYER_ROUTE}:id`} element={<OnlineGameScreen />} errorElement={<ErrorPage/>} />
	</Route>
))

ReactDOM.createRoot(document.getElementById('root')).render(
	<Provider store={store}>
		<RouterProvider router={router}/>
	</Provider>,
)
