import { Link } from "react-router-dom"
import OpacityIcon from "../../assets/icons/OpacityIcon"
import { useState } from "react"

function FinishPopup({ winner="Player", reason = "" }) {
    const [opacity, toggleOpacity] = useState(false)

    const handleOpacity = () => {
        toggleOpacity(!opacity)
    }

    return (
        <div className="absolute flex items-center justify-center w-full h-full bg-black/50">
            <div className={`relative w-[90%] md:w-[40rem] aspect-square md:aspect-video bg-[url('/images/paper-light.png')] dark:bg-[url('/images/paper-dark.png')] flex flex-col items-center justify-center rounded-xl px-6 md:px-8${opacity ? " opacity-50" : ""}`}>
                <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6">
                    <OpacityIcon className="absolute w-6 cursor-pointer fill-black right-4 top-4 dark:fill-dark" onClick={handleOpacity}/>

                    <div className="flex flex-col items-center justify-center text-xl md:text-2xl">
                        <h1 className="text-4xl md:text-5xl font-crossedout">Game over</h1>
                        <h2 className="font-bold font-strokedim dark:font-normal">{winner} won the game!</h2>
                    </div>

                    <h2 className="text-xl font-bold text-center md:text-2xl font-strokedim dark:font-normal">{reason}</h2>
                    <Link to="/" className="absolute font-bold bottom-4 md:bottom-10 font-strokedim dark:font-normal"><i>- Return to main menu -</i></Link>
                </div>
            </div>
        </div>
    )
}

export default FinishPopup