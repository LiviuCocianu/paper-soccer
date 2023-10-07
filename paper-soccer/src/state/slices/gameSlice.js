import { createSlice } from "@reduxjs/toolkit"
import { GAME_MODE, GAME_STATUS } from "../../constants"

const initialState = {
    // Client & server state
    activePlayer: 1,
    mode: GAME_MODE.CLASSIC,
    status: GAME_STATUS.WAITING,
    ballPosition: 52,
    // Client only state
    clientUsername: "",
    countdown: 5,
    nodes: [],
    history: {52: []},
    // Singleplayer only state
    won: false, // false for bot, true for player
}

export const gameSlice = createSlice({
    name: "game",
    initialState,
    reducers: {
        // Client & server actions
        setActivePlayer: (state, action) => {
            const val = Math.max(1, Math.min(2, action.payload))
            state.activePlayer = val
            return state
        },
        setGameMode: (state, action) => {
            const val = !Object.keys(GAME_MODE).includes(action.payload) ? initialState.mode : action.payload
            state.mode = val
            return state
        },
        setStatus: (state, action) => {
            const val = !Object.keys(GAME_STATUS).includes(action.payload) ? initialState.status : action.payload
            state.status = val
            return state
        },
        setBallPosition: (state, action) => {
            const val = Math.max(0, Math.min(state.nodes.length - 1, action.payload))
            state.ballPosition = val
            return state
        },
        // Client only actions
        setClientUsername: (state, action) => {
            state.clientUsername = action.payload.slice(0, 16)
            return state
        },
        setCountdown: (state, action) => {
            const val = Math.max(0, action.payload)
            state.countdown = val
            return state
        },
        setNodes: (state, action) => {
            state.nodes = action.payload
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
        },
        // Singleplayer only state
        setWon: (state, action) => {
            state.won = action.payload
            return state
        },
        connectNodes: (state, action) => {
            const { from, to, creator } = action.payload

            if (!from || !to || !creator) return state
            if (creator < 1 || creator > 2) return state

            // Add from - to relation
            if (!state.history[from]) {
                state.history[from] = []
            }

            state.history[from].push({ point: to, player: creator })

            // Add to - from relation
            if (!state.history[to]) {
                state.history[to] = []
            }

            state.history[to].push({ point: from, player: creator })

            return state
        },
        // Reset action
        resetGameState: (state) => {
            state = initialState
            return state
        },
    }
})

export const { 
    // Client & server actions
    setActivePlayer, 
    setGameMode, 
    setStatus,
    setBallPosition, 
    // Client only actions
    setClientUsername,
    setCountdown,
    setNodes,
    setHistory,
    addHistoryMove,
    // Singleplayer only state
    connectNodes,
    setWon,
    // Reset action
    resetGameState,
} = gameSlice.actions

export default gameSlice.reducer