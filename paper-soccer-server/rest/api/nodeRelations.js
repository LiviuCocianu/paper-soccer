import express from "express"
import pool from "../../database/index.js"
import { CRUD, getAll, selectQuery } from "../utils.js"

const router = express.Router()

// Get all
router.get("/", (req, res) => {
    getAll("PitchNodeRelation", req, res)
})

// Get one
router.get("/:id", (req, res) => {
    const nodeId = req.params.id
    const { point } = req.query

    let query = "SELECT * FROM PitchNodeRelation WHERE pitchNodeId=?"
    const values = [nodeId]

    if (point != undefined) {
        query += " AND point=?"
        values.push(point)
    }

    selectQuery(query, values, res)
})

// Create
router.post("/:id", async (req, res) => {
    const conn = await pool.promise().getConnection()

    const nodeId = req.params.id
    const { point, creator=1 } = req.body;

    if (point == undefined) {
        res.status(500).json(CRUD.ERROR("No point specified in request body!"))
        return
    } else if (point < 0) {
        res.status(500).json(CRUD.ERROR("Point cannot be negative!"))
        return
    }

    const [nodeRel] = await conn.query("SELECT * FROM PitchNodeRelation WHERE pitchNodeId=?", [nodeId])

    if(nodeRel.length >= 8) {
        res.status(500).json(CRUD.ERROR("A node cannot have more than 8 relations!"))
        return
    }

    try {
        const [nodeRelRes] = await conn.query("INSERT INTO PitchNodeRelation (point, creator, pitchNodeId) VALUES (?, ?, ?)", [point, creator, nodeId])
        const [nodeRel] = await conn.query("SELECT * FROM PitchNodeRelation WHERE id=?", [nodeRelRes.insertId])

        res.status(200).json(CRUD.CREATED("OK", nodeRel[0]))
    } catch (err) {
        res.status(500).json(CRUD.ERROR(err.message))
    } finally {
        pool.releaseConnection(conn)
    }
})

// Delete
router.delete("/:id", async (req, res) => {
    const nodeId = req.params.id
    const { point } = req.query

    if (point != undefined && point < 0) {
        res.status(500).json(CRUD.ERROR("Point cannot be negative!"))
        return
    }

    const conn = await pool.promise().getConnection()

    try {
        let selQuery = "SELECT * FROM PitchNodeRelation WHERE pitchNodeId=?"
        let delQuery = "DELETE FROM PitchNodeRelation WHERE pitchNodeId=?"
        const values = [nodeId]

        if (point != undefined) {
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