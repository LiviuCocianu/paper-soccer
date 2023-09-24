import express from "express"
import apiRoute from "./api/index.js"
import cors from "cors"

const app = express()

app.use(express.json())
app.use(cors({
    origin: `${process.env.CLIENT_ADDRESS}:${process.env.CLIENT_PORT}`,
    methods: ["GET", "POST", "PATCH", "DELETE"]
}))

app.use("/api", apiRoute)

export default app