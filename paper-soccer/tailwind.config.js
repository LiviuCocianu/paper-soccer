/** @type {import('tailwindcss').Config} */
export default {
	darkMode: "class",
	content: [
		"./index.html",
		"./src/components/**/*.{js,jsx}",
		"./src/screens/**/*.{js,jsx}"
	],
	safelist: [
		{
			pattern: /translate-x-+/,
		},
		{
			pattern: /bottom-+/,
		}
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
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				weakPulse: {
					'0%': { opacity: '0.2' },
					'100%': { opacity: '1' },
				}
			},
			animation: {
				fadingIn: 'fadeIn 500ms linear 1',
				weakPulse: 'weakPulse 1s alternate infinite',
			}
		},
	},
	plugins: [],
}

