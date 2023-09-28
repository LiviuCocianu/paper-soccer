import { createSlice } from "@reduxjs/toolkit"
import { GAME_STATUS } from "../../constants"

const initialState = {
    clientUsername: "Player", 
    nodes: [],
    activePlayer: 1,
    status: GAME_STATUS.WAITING,
    scores: [0, 0],
    ballPosition: 52,
    history: {},
    countdown: 5
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
        setClientUsername: (state, action) => {
            state.clientUsername = action.payload.slice(0, 16)
            return state
        },
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
            const val = !Object.keys(GAME_STATUS).includes(action.payload) ? initialState.status : action.payload
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
        setCountdown: (state, action) => {
            const val = Math.max(0, action.payload)
            state.countdown = val
            return state
        },
        resetGameState: (state) => {
            state = initialState
            return state
        },
        setHistory: (state, action) => {
            state.history = action.payload
            return state
        },
        addHistoryMove: (state, action) => {
            const { point, player } = action.payload

            if(!point || !player) return state
            if(player < 1 || player > 2) return state

            // Add point - ballPosition relation
            if (!state.history[point]) {
                state.history[point] = []
            }
            
            state.history[point].push({ point: state.ballPosition, player })

            // Add ballPosition - point relation
            if (!state.history[state.ballPosition]) {
                state.history[state.ballPosition] = []
            }
            
            state.history[state.ballPosition].push({ point, player })

            return state
        }
    }
})

export const { setClientUsername, setNodes, setActivePlayer, setStatus, setScoreFor, setBallPosition, setHistory, setCountdown, resetGameState, addHistoryMove } = gameSlice.actions
export default gameSlice.reducer