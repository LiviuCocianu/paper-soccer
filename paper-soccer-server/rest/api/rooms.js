import express from "express"
import pool from "../../database/index.js"
import codeGenerator from "voucher-code-generator"
import { GAME_MODE } from "../../../paper-soccer/src/constants.js"
import { composeUpdateSQL } from "../../utils.js"
import { CRUD, getAll, selectQuery } from "../utils.js"

const router = express.Router()

// Get all
router.get("/", (req, res) => {
    getAll("Room", req, res)
})

// Get one
router.get("/:id", (req, res) => {
    const inviteCode = req.params.id
    selectQuery("SELECT * FROM Room WHERE inviteCode=?", [inviteCode], res)
})

// Create
router.post("/", async (req, res) => {
    const conn = await pool.promise().getConnection()

    const { gameMode=GAME_MODE.CLASSIC } = req.body;
    const inviteCode = codeGenerator.generate()

    if(!Object.keys(GAME_MODE).includes(gameMode)) {
        res.status(500).json(CRUD.ERROR(`Invalid gameMode value! Valid options: ${Object.keys(GAME_MODE).join(", ")}`))
        return
    }

    try {
        const [roomRes] = await conn.query("INSERT INTO Room (inviteCode) VALUES (?)", [inviteCode])
        const [stateRes] = await conn.query("INSERT INTO GameState (mode, roomId) VALUES (?, ?)", [gameMode, roomRes.insertId])
        await conn.query("UPDATE Room SET stateId=? WHERE id=?", [stateRes.insertId, roomRes.insertId])
        const [room] = await conn.query("SELECT * FROM Room WHERE inviteCode=?", [inviteCode])

        res.status(200).json(CRUD.CREATED("OK", room[0]))
    } catch(err) {
        res.status(500).json(CRUD.ERROR(err.message))
    } finally {
        pool.releaseConnection(conn)
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
    const composed = composeUpdateSQL("Room", req.body) + " WHERE `id`=?"

    try {
        const [roomById] = await conn.query("SELECT id FROM Room WHERE inviteCode=?", [inviteCode])

        if (roomById.length == 0) {
            res.status(204).json()
            return
        }

        const roomId = roomById[0].id

        await conn.query(composed, [roomId])
        const [room] = await conn.query("SELECT * FROM Room WHERE id=?", [roomId])

        res.status(200).json(CRUD.UPDATED("OK", room[0]))
    } catch (err) {
        res.status(500).json(CRUD.ERROR(err.message))
    } finally {
        pool.releaseConnection(conn)
    }
})

// Delete one
router.delete("/:id", async (req, res) => {
    const inviteCode = req.params.id
    const conn = await pool.promise().getConnection()

    try {
        const [roomById] = await conn.query("SELECT id FROM Room WHERE inviteCode=?", [inviteCode])
        
        if (roomById.length == 0) {
            res.status(204).json()
            return
        }
        
        const roomId = roomById[0].id

        await conn.query("UPDATE Room SET stateId=? WHERE id=?", [null, roomId])
        await conn.query("DELETE FROM GameState WHERE roomId=?", [roomId])
        await conn.query("DELETE FROM Room WHERE id=?", [roomId])

        res.status(200).json(CRUD.DELETED("OK"))
    } catch (err) {
        res.status(500).json(CRUD.ERROR(err.message))
    } finally {
        pool.releaseConnection(conn)
    }
})

export default router