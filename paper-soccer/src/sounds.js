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
        buttonSound: "./sounds/button.mp3",
        radioButtonSound: "./sounds/radio_button.mp3",
        startedSound: "./sounds/started.mp3",
        countdownSound: "./sounds/countdown.mp3",
        moveSound: "./sounds/move.mp3",
        invalidMoveSound: "./sounds/invalid_move.mp3",
        winSound: "./sounds/win.mp3",
        loseSound: "./sounds/lose.mp3",
    }

    for (let [key, val] of Object.entries(paths)) {
        sounds[key] = new Howl({
            src: [val],
            volume: 0.5
        })
    }
}

export default sounds