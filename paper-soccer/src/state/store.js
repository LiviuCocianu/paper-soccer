import { configureStore } from "@reduxjs/toolkit";
import themeSlice from "./slices/themeSlice";
import gameSlice from "./slices/gameSlice";

export const store = configureStore({
    reducer: {
        theme: themeSlice,
        game: gameSlice
    }
})