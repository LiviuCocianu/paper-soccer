import { Link } from "react-router-dom"

function FinishPopup({ winner="Player", reason = "" }) {
    return (
        <div className="absolute flex items-center justify-center w-full h-full bg-black/50">
            <div className="relative w-[40rem] aspect-video bg-[url('/images/paper-light.png')] dark:bg-[url('/images/paper-dark.png')] flex flex-col space-y-10 items-center justify-center rounded-xl">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <h1 className="text-5xl font-crossedout">Game over</h1>
                    <h2 className="text-3xl font-strokedim">{winner} won the game! {reason}</h2>
                    <Link to="/" className="absolute text-2xl bottom-10 font-strokedim"><i>- Return to main menu -</i></Link>
                </div>
            </div>
        </div>
    )
}

export default FinishPopup