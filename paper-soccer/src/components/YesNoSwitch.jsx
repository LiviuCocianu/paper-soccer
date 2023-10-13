import { useEffect, useMemo, useRef } from "react"
import sounds from "../sounds"

function YesNoSwitch({ width=20, isYes, setResponse }) {
    const switchBoxRef = useRef()
    const switchBallRef = useRef()
    const height = useMemo(() => Math.ceil(width / 2), [width])

    const handleSwitch = () => {
        setResponse(!isYes)
        sounds.buttonSound.play()
    }

    useEffect(() => {
        if (!switchBallRef) return

        switchBallRef.current.classList.remove("translate-x-" + height)

        if(isYes) {
            switchBallRef.current.classList.add("translate-x-" + height)
        }
    }, [height, isYes, switchBallRef])
    
    useEffect(() => {
        if (!switchBoxRef) return

        switchBoxRef.current.classList.add("w-" + width)
        switchBoxRef.current.classList.add("h-" + height)
    }, [switchBoxRef])

    return (
        <div className="cursor-pointer" onClick={handleSwitch}>
            {/* Box */}
            <div ref={switchBoxRef} className="border rounded-full border-black dark:border-dark p-[4px] flex">
                {/* Ball */}
                <div ref={switchBallRef} className="flex items-center justify-center h-full transition-transform duration-300 bg-black rounded-full dark:bg-dark aspect-square">
                    <span className="text-white dark:text-black font-heycomic">{isYes ? "Y" : "N"}</span>
                </div>
            </div>
        </div>
    )
}

export default YesNoSwitch