import { useDispatch, useSelector } from "react-redux"
import MoonIcon from "../assets/icons/MoonIcon"
import SunIcon from "../assets/icons/SunIcon"
import { useCallback, useEffect } from "react"
import { setTheme } from "../state/slices/themeSlice"

function ThemeSwitch() {
	const appTheme = useSelector(state => state.theme)
	const dispatch = useDispatch()

	// Persist theme from local storage
	useEffect(() => {
		const th = localStorage.getItem("theme")
		if (th) toggleTheme(th)
	}, [])

	const toggleTheme = useCallback((value) => {
		let th = "light"

		if ((value && value == "dark") || (!value && appTheme == "light")) {
			th = "dark"
			document.getElementById("root").classList.add("dark")
		} else if ((value && value == "light") || (!value && appTheme == "dark")) {
			document.getElementById("root").classList.remove("dark")
		}

		localStorage.setItem("theme", th)
		dispatch(setTheme(th))
	}, [dispatch, appTheme])

	return (
		<div className="absolute top-0 m-2 cursor-pointer md:right-0 md:m-6" onClick={() => toggleTheme()}>
			{/* Box */}
			<div className="w-20 h-10 mt-2 md:mt-0 border rounded-full border-black dark:border-dark p-[4px] flex">
				{/* Ball */}
				<div className="flex h-full transition-transform duration-300 bg-black rounded-full dark:bg-dark aspect-square dark:translate-x-10">
					{
						appTheme == "light"
							? <MoonIcon className="fill-white" />
							: <SunIcon className="m-1 fill-white dark:fill-black" />
					}
				</div>
			</div>
		</div>
	)
}

export default ThemeSwitch