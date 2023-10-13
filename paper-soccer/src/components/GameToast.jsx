import { useEffect, useRef } from 'react'

function GameToast({ maxWidth, text="", setText }) {
	const toastRef = useRef()

	useEffect(() => {
		if(!toastRef || !setText) return

		toastRef.current.classList.add("opacity-0")

		let tid = -1

		if(text.length > 0) {
			toastRef.current.classList.remove("opacity-0")

			tid = setTimeout(() => {
				toastRef.current.classList.add("opacity-0")
				setTimeout(() => setText(""), 1000)
			}, 4000)
		}

		return () => {
			if(tid != -1) clearTimeout(tid)
		}
	}, [text, toastRef, setText])

	return (
		<div ref={toastRef} className="absolute p-4 px-8 transition-opacity duration-1000 bg-gray-400 border border-gray-500 rounded-md shadow-lg dark:bg-gray-600 bottom-6 dark:border-gray-700" style={{ maxWidth }}>
			<p className="text-nightsky dark:text-dark font-heycomic">{text}</p>
		</div>
	)
}

export default GameToast