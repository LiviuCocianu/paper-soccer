import { useEffect, useState } from "react"
import { GAME_MODE } from "../constants"
import { useDispatch } from "react-redux"

import GamemodeSelector from "../components/GamemodeSelector"
import SubmitButton from "../components/SubmitButton"
import InputField from "../components/InputField"


function SingleplayerScreen() {
    const [gamemode, setGamemode] = useState(GAME_MODE.CLASSIC)

    const dispatch = useDispatch()

    const handleSubmit = () => {
        dispatch(setGamemode(gamemode))
    }

    useEffect(() => {
        document.title = "Paper Soccer - Singleplayer"
    }, [])

    return (
        <div className="flex flex-col items-center justify-center w-full h-full space-y-10 select-none dark:text-dark">
            <div>
                <h1 className="text-5xl font-crossedout">Match settings</h1>
                <h2 className="text-2xl font-bold font-strokedim dark:font-normal">Choose a game mode</h2>

                <GamemodeSelector 
                    gamemode={gamemode}
                    setGamemode={setGamemode}
                    className="space-y-2"/>

                <InputField/>

                <SubmitButton text="Create" loadingColors="fill-white dark:fill-black" onClick={handleSubmit}/>
            </div>
        </div>
    )
}


export default SingleplayerScreen