import express from "express"
import pool from "../../database/index.js"
import { composeUpdateSQL } from "../../utils.js"
import { CRUD, getAll } from "../utils.js"

const router = express.Router()

// Get all
router.get("/", (req, res) => {
    getAll("GameState", req, res)
})

// Get one
router.get("/:id", async (req, res) => {
    const conn = await pool.promise().getConnection()
    const inviteCode = req.params.id

    try {
        const [roomById] = await conn.query("SELECT id FROM Room WHERE inviteCode=?", [inviteCode])
    
        if (roomById.length == 0) {
            res.status(204).json()
            return
        }
    
        const roomId = roomById[0].id
        const [gameState] = await conn.query("SELECT * FROM GameState WHERE roomId=?", [roomId])

        res.status(200).json(CRUD.READ("OK", gameState[0]))
    } catch(err) {
        res.status(500).json(CRUD.ERROR(err.message))
    }
})

// Update one
router.patch("/:id", async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        res.status(400).json(CRUD.ERROR("No columns specified in request body"))
        return
    }

    if (Object.keys(req.body).includes("id")) {
        res.status(400).json(CRUD.ERROR("You cannot update the ID column!"))
        return
    }

    const inviteCode = req.params.id
    const conn = await pool.promise().getConnection()
    const composed = composeUpdateSQL("GameState", req.body) + " WHERE `id`=?"

    try {
        // Get room for requested invite code
        const [roomById] = await conn.query("SELECT id FROM Room WHERE inviteCode=?", [inviteCode])

        if (roomById.length == 0) {
            res.status(204).json()
            return
        }

        const roomId = roomById[0].id

        // ... then update game state based on the found room ID
        await conn.query(composed, [roomId])
        const [gameState] = await conn.query("SELECT * FROM GameState WHERE roomId=?", [roomId])

        res.status(200).json(CRUD.UPDATED("OK", gameState[0]))
    } catch (err) {
        res.status(500).json(CRUD.ERROR(err.message))
    } finally {
        pool.releaseConnection(conn)
    }
})

export default router