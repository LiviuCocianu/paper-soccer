import { GAME_STATUS } from "./constants"
import { connectNodes, setCountdown, setStatus } from "./state/slices/gameSlice"

export default class GameServerEmulator {
    #dispatch
    
    constructor(dispatch) {
        /**
         * @type {import("@reduxjs/toolkit").Dispatch}
         * @private
         */
        this.dispatch = dispatch
    }

    /**
     * Adds a relation from node point to node point and vice-versa
     * 
     * @param {number} from From node point
     * @param {number} to To node point
     * @param {number} creator Room order number of the player that made the relation
     */
    addNodeRelation(from, to, creator) {
        this.dispatch(connectNodes({ from, to, creator }))
    }

    startCountdown() {
        let counter = 5

        const cd = setInterval(async () => {
            if (counter > 1) {
                counter--
                this.dispatch(setCountdown(counter))
            } else {
                clearInterval(cd)
                this.dispatch(setStatus(GAME_STATUS.ONGOING))
            }
        }, 1000)

        return cd
    }
}