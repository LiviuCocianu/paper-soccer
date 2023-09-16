import express from "express"
import pool from "../../database/index.js"
import { composeUpdateSQL } from "../../utils.js"
import { CRUD, getAll, selectQuery } from "../utils.js"

const router = express.Router()

// Get all
router.get("/", (req, res) => {
    getAll("Player", req, res)
})

// Get one
router.get("/:id", (req, res) => {
    const inviteCode = req.params.id
    selectQuery("SELECT * FROM Player WHERE invitedTo=?", [inviteCode], res)
})

// Create
router.post("/", async (req, res) => {
    const conn = await pool.promise().getConnection()

    const { username, invitedTo } = req.body;

    if (username && username.length > 16) {
        res.status(400).json(CRUD.ERROR("Username is longer than 16 characters!"))
        return
    }

    if (!invitedTo) {
        res.status(400).json(CRUD.ERROR("No invitedTo specified in request body!"))
        return
    } else if (invitedTo.length > 8) {
        res.status(400).json(CRUD.ERROR("Invite code is longer than 8 characters!"))
        return
    }

    try {
        const [roomRes] = await conn.query("SELECT * FROM Room WHERE inviteCode=?", [invitedTo])

        if(roomRes.length == 0) {
            res.status(500).json(CRUD.ERROR("No room corresponding to this invite code was found!"))
            return
        }

        const [playerCount] = await conn.query("SELECT COUNT(*) FROM Player WHERE invitedTo=?", [invitedTo])
        const count = playerCount[0]["COUNT(*)"]

        if (count == 2) {
            res.status(500).json(CRUD.ERROR("Room corresponding to this invite code is full!"))
            return
        }

        const roomOrder = count + 1

        const [playerRes] = await conn.query(`INSERT INTO Player 
            (roomOrder, score, invitedTo${username ? ", username" : ""}) 
            VALUES (?, ?, ?${username ? ", ?" : ""})
        `, [roomOrder, 0, invitedTo, username])

        const [player] = await conn.query("SELECT * FROM Player WHERE id=?", [playerRes.insertId])

        res.status(200).json(CRUD.CREATED("OK", player[0]))
    } catch (err) {
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

    if(Object.keys(req.body).includes("id")) {
        res.status(400).json(CRUD.ERROR("You cannot update the ID column!"))
        return
    }

    const id = req.params.id
    const conn = await pool.promise().getConnection()
    const composed = composeUpdateSQL("Player", req.body) + " WHERE `id`=?"

    try {
        const [playerById] = await conn.query("SELECT * FROM Player WHERE id=?", [id])

        if (playerById.length == 0) {
            res.status(204).json()
            return
        }

        await conn.query(composed, [id])
        const [player] = await conn.query("SELECT * FROM Player WHERE id=?", [id])

        res.status(200).json(CRUD.UPDATED("OK", player[0]))
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