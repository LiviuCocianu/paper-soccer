function CountdownPopup({ count }) {
    return (
        <div className="absolute flex items-center justify-center w-full h-full bg-black/50">
            <div className="w-[40rem] aspect-video bg-[url('/images/paper-light.png')] dark:bg-[url('/images/paper-dark.png')] flex flex-col space-y-10 items-center justify-center rounded-xl">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <h1 className="text-5xl font-strokedim">Game starting in...</h1>
                    <h2 className="text-6xl font-crossedout">{count}</h2>
                </div>
            </div>
        </div>
    )
}

export default CountdownPopup