import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import sounds from '../../sounds'

function CountdownPopup({ count }) {
    const { countdown } = useSelector(state => state.game)

    useEffect(() => {
        sounds.countdownSound.play()
    }, [countdown])

    return (
        <div className="absolute flex items-center justify-center w-full h-full bg-black/50">
            <div className="w-[90%] md:w-[40rem] aspect-square md:aspect-video bg-[url('/images/paper-light.png')] dark:bg-[url('/images/paper-dark.png')] flex flex-col items-center justify-center rounded-xl">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <h1 className="text-3xl md:text-5xl font-strokedim">Game starting in...</h1>
                    <h2 className="text-4xl md:text-6xl font-crossedout">{count}</h2>
                </div>
            </div>
        </div>
    )
}

export default CountdownPopup