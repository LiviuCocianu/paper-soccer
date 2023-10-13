import { Howl } from "howler"

const sounds = {
    buttonSound: null,
    radioButtonSound: null,
    startedSound: null,
    countdownSound: null,
    moveSound: null,
    invalidMoveSound: null,
    winSound: null,
    loseSound: null,
}

export function init() {
    const paths = {
        buttonSound: "button.mp3",
        radioButtonSound: "radio_button.mp3",
        startedSound: "started.mp3",
        countdownSound: "countdown.mp3",
        moveSound: "move.mp3",
        invalidMoveSound: "invalid_move.mp3",
        winSound: "win.mp3",
        loseSound: "lose.mp3",
    }

    for (let [key, val] of Object.entries(paths)) {
        sounds[key] = new Howl({
            src: [`sounds/${val}`],
            volume: 0.5
        })
    }
}

export default sounds