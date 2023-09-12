import { createSlice } from "@reduxjs/toolkit"
import { GAME_STATUS } from "../../constants"

const initialState = {
    nodes: [],
    activePlayer: 1,
    status: "WAITING",
    scores: [0, 0],
    ballPosition: 52,
    history: {}
}

// Example of history object; TODO remove this on production release
/*
{
    52: [{ point: 51, player: 1 }],
    51: [{ point: 52, player: 1 }, { point: 39, player: 2 }],
    39: [{ point: 51, player: 2 }]
}
*/

export const gameSlice = createSlice({
    name: "game",
    initialState,
    reducers: {
        setNodes: (state, action) => {
            state.nodes = action.payload
            return state
        },
        setActivePlayer: (state, action) => {
            const val = Math.max(1, Math.min(2, action.payload))
            state.activePlayer = val
            return state
        },
        setStatus: (state, action) => {
            const val = !GAME_STATUS.includes(action.payload) ? initialState.status : action.payload
            state.status = val
            return state
        },
        setScoreFor: (state, action) => {
            let { player=1, value=0 } = action.payload
            player = Math.max(1, Math.min(2, player))
            value = Math.max(0, Math.min(3, value))
            state.scores[player - 1] = value
            return state
        },
        setBallPosition: (state, action) => {
            const val = Math.max(0, Math.min(state.nodes.length - 1, action.payload))
            state.ballPosition = val
            return state
        },
        setHistory: (state, action) => {
            state.history = action.payload
            return state
        }
    }
})

export const { setNodes, setActivePlayer, setStatus, setScoreFor, setBallPosition, setHistory } = gameSlice.actions
export default gameSlice.reducer