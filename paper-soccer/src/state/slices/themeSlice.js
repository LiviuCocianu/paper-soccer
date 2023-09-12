import { createSlice } from "@reduxjs/toolkit"

const initialState = "light"

export const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setTheme: (state, action) => {
            const val = action.payload != "light" && action.payload != "dark" ? "light" : action.payload;
            state = val
            return state
        }
    }
})

export const { setTheme } = themeSlice.actions
export default themeSlice.reducer