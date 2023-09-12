import React from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'

import { Provider } from 'react-redux'
import { store } from './state/store'

import {
	createBrowserRouter,
	createRoutesFromElements,
	RouterProvider,
	Route
} from "react-router-dom"

// Screens
import App from './components/App'
import Home from './components/Home'
import MultiplayerScreen from './components/MultiplayerScreen'
import ErrorPage from './components/error/ErrorPage'
import GameErrorPage from './components/error/GameErrorPage'
import GameScreen from './components/GameScreen'

const router = createBrowserRouter(createRoutesFromElements(
	<Route path="/" element={<App/>} errorElement={<ErrorPage/>}>
		<Route element={<Home/>} index/>
		<Route path="/multiplayer" element={<MultiplayerScreen/>}/>
		<Route path="/game" element={<GameErrorPage/>}/>
		<Route path="/game/:id" element={<GameScreen/>} errorElement={<ErrorPage/>} />
	</Route>
))

ReactDOM.createRoot(document.getElementById('root')).render(
	<Provider store={store}>
		<RouterProvider router={router}/>
	</Provider>,
)
