import { useEffect, useState } from "react"
import { GAME_MODE } from "../constants"
import { useDispatch } from "react-redux"

import GamemodeSelector from "../components/GamemodeSelector"
import SubmitButton from "../components/SubmitButton"
import YesNoSwitch from "../components/YesNoSwitch"
import { setActivePlayer, setGameMode } from "../state/slices/gameSlice"
import { useNavigate } from "react-router-dom"


function SingleplayerScreen() {
    const [gamemode, setGamemode] = useState(GAME_MODE.CLASSIC)
    const [isYes, setResponse] = useState(true)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleSubmit = () => {
        dispatch(setGameMode(gamemode))
        dispatch(setActivePlayer(isYes ? 1 : 2))

        navigate("/singleplayer/game")
    }

    useEffect(() => {
        document.title = "Paper Soccer - Singleplayer"
    }, [])

    return (
        <div className="flex flex-col items-center justify-center w-full h-full space-y-10 select-none dark:text-dark">
            <div className="flex flex-col p-10 border-2 border-black dark:border-dark px-14 rounded-2xl animate-fadingIn">
                <div className="flex flex-col items-center justify-center w-full h-full space-y-6 select-none dark:text-dark">
                    <h1 className="self-start text-5xl font-crossedout">Match settings</h1>

                    <section className="space-y-2">
                        <h2 className="text-2xl font-bold font-strokedim dark:font-normal">Choose a game mode</h2>
                        <GamemodeSelector 
                            gamemode={gamemode}
                            setGamemode={setGamemode}
                            className="space-y-2"/>
                    </section>

                    <section className="flex w-full space-x-4">
                        <h2 className="text-2xl font-bold font-strokedim dark:font-normal">Should you get the first turn?</h2>
                        <YesNoSwitch width={16} isYes={isYes} setResponse={setResponse}/>
                    </section>

                    <SubmitButton text="Start" loadingColors="fill-white dark:fill-black" onClick={handleSubmit}/>
                </div>
            </div>
        </div>
    )
}


export default SingleplayerScreen