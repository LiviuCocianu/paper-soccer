import express from "express"
import pool from "../../database/index.js"
import { CRUD, getAll, selectQuery } from "../utils.js"

const router = express.Router()

// Get all
router.get("/", (req, res) => {
    getAll("PitchNode", req, res)
})

// Get one
router.get("/:id", (req, res) => {
    const stateId = req.params.id
    const { point } = req.query

    let query = "SELECT * FROM PitchNode WHERE stateId=?"
    const values = [stateId]

    if(point != undefined) {
        query += " AND point=?"
        values.push(point)
    }

    selectQuery(query, values, res)
})

// Create
router.post("/", async (req, res) => {
    const conn = await pool.promise().getConnection()

    const { point, stateId } = req.body;

    if(point == undefined) {
        res.status(500).json(CRUD.ERROR("No point specified in request body!"))
        return
    } else if(point < 0) {
        res.status(500).json(CRUD.ERROR("Point cannot be negative!"))
        return
    }

    if (!stateId) {
        res.status(500).json(CRUD.ERROR("No stateId specified for this node! Node must be associated to a game state"))
        return
    }

    try {
        const [nodeRes] = await conn.query("INSERT INTO PitchNode (point, stateId) VALUES (?, ?)", [point, stateId])
        const [node] = await conn.query("SELECT * FROM PitchNode WHERE id=?", [nodeRes.insertId])

        res.status(200).json(CRUD.CREATED("OK", node[0]))
    } catch (err) {
        res.status(500).json(CRUD.ERROR(err.message))
    } finally {
        pool.releaseConnection(conn)
    }
})

// Delete
router.delete("/:id", async (req, res) => {
    const stateId = req.params.id
    const { point } = req.query

    if (point != undefined && point < 0) {
        res.status(500).json(CRUD.ERROR("Point cannot be negative!"))
        return
    }

    const conn = await pool.promise().getConnection()

    try {
        let selQuery = "SELECT * FROM PitchNode WHERE stateId=?"
        let delQuery = "DELETE FROM PitchNode WHERE stateId=?"
        const values = [stateId]

        if(point != undefined) {
            selQuery += "AND point=?"
            delQuery += "AND point=?"
            values.push(point)
        }

        const [nodeRes] = await conn.query(selQuery, values)

        if (nodeRes.length == 0) {
            res.status(204).json()
            return
        }

        await conn.query(delQuery, values)

        res.status(200).json(CRUD.DELETED("OK"))
    } catch (err) {
        res.status(500).json(CRUD.ERROR(err.message))
    } finally {
        pool.releaseConnection(conn)
    }
})

export default router