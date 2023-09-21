function LoadingScreen({ title="Loading..." }) {
	return (
		<div className="flex items-center justify-center w-full h-full animate-fadingIn">
			<div className="flex flex-col items-center justify-center space-y-6">
				<svg className="fill-black dark:fill-dark" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="10rem" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
					<path d="M3 50A47 47 0 0 0 97 50A47 49 0 0 1 3 50" stroke="none">
						<animateTransform attributeName="transform" type="rotate" dur="0.641025641025641s" repeatCount="indefinite" keyTimes="0;1" values="0 50 51;360 50 51"></animateTransform>
					</path>
				</svg>

				<h1 className="text-2xl text-black animate-weakPulse font-heycomic dark:text-dark">{title}</h1>
			</div>
		</div>
	)
}

export default LoadingScreen