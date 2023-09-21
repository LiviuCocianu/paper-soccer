import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { socketClient } from "../../main"

const initialState = {
    status: ""
}

/**
 * Send a store action to connect to the socket
 * @param {object} object args
 * @param {string} object.room Invite code for the room you want to connect to
 * @param {string} [object.username] Username to be associated with the socket connection
 */
export const connectToSocket = createAsyncThunk("connectToSocket", async ({room, username}) => {
    return await socketClient.connect(room, username)
})

/**
 * Send a store action to disconnect from the socket
 */
export const disconnectFromSocket = createAsyncThunk("disconnectFromSocket", async () => {
    return await socketClient.disconnect()
})

const socketSlice = createSlice({
    name: "socket",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(connectToSocket.pending, (state) => {
            state.status = "connecting"
        })

        builder.addCase(connectToSocket.fulfilled, (state) => {
            state.status = "connected"
        })

        builder.addCase(connectToSocket.rejected, (state) => {
            state.status = "connection failed"
        })

        builder.addCase(disconnectFromSocket.pending, (state) => {
            state.status = "disconnecting"
        })

        builder.addCase(disconnectFromSocket.fulfilled, (state) => {
            state.status = "disconnected"
        })

        builder.addCase(disconnectFromSocket.rejected, (state) => {
            state.status = "disconnection failed"
        })
    }
})

export default socketSlice.reducer