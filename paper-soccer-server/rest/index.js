import express from "express"
import apiRoute from "./api/index.js"

const app = express()

export function setupExpressApp() {
    app.use(express.json())

    app.use("/api", apiRoute)
}

export default app
