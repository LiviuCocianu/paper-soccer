import { configureStore } from "@reduxjs/toolkit"
import themeSlice from "./slices/themeSlice"
import gameSlice from "./slices/gameSlice"
import socketSlice from "./slices/socketSlice"

export const store = configureStore({
    reducer: {
        theme: themeSlice,
        game: gameSlice,
        socket: socketSlice,
    }
})