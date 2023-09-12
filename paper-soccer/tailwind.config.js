/** @type {import('tailwindcss').Config} */
export default {
	darkMode: "class",
	content: [
		"./index.html",
		"./src/components/**/*.{js,jsx}"
	],
	theme: {
		fontFamily: {
			"crossedout": ["CrossedOut"],
			"heycomic": ["HeyComic"],
			"strokedim": ["StrokeDimension"]
		},
		extend: {
			colors: {
				"dark": "#d9deff",
				"nightsky": "#1b1b1d"
			}
		},
	},
	plugins: [],
}

