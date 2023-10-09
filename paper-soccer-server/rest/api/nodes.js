import express from "express"
import { CRUD, errorStatusFunc, getAll } from "../utils.js"
import { query } from "../../prisma/client.js"

const router = express.Router()

// Get all
router.get("/", (req, res) => {
    getAll("pitchnode", req, res)
})

// Get one
router.get("/:id", (req, res) => {
    const { page = 1, size = process.env.SQL_SELECTION_LIMIT } = req.query
    const pageSize = Math.max(1, Math.min(size, process.env.SQL_SELECTION_LIMIT))
    const toSkip = Math.max(0, (page - 1) * pageSize)
    
    const inviteCode = req.params.id
    const { point } = req.query

    query(async (prisma) => {
        const one = await prisma.room.findUnique({
            where: { inviteCode },
            select: { gamestate: {
                select: { nodes: {
                    skip: toSkip,
                    take: pageSize,
                    where: { point }
                } }
            } }
        })

        if(one == null || one.gamestate.nodes.length == 0) {
            res.status(204).send()
            return
        }

        res.status(200).json(CRUD.READ("OK", one.gamestate.nodes))
    }, (e) => errorStatusFunc(res, e))
})

// Create
router.post("/:id", async (req, res) => {
    const inviteCode = req.params.id
    const { point } = req.body

    if(point == undefined) {
        res.status(500).json(CRUD.ERROR("No point specified in request body!"))
        return
    } else if(point < 0) {
        res.status(500).json(CRUD.ERROR("Point cannot be negative!"))
        return
    }

    query(async (prisma) => {
        const room = await prisma.room.findUnique({
            where: { inviteCode },
            select: { gamestate: true }
        })

        if (room == null || room.gamestate == null) {
            res.status(400).json(CRUD.ERROR("No game state corresponding to this state ID was found!"))
            return
        }

        const inserted = await prisma.pitchnode.create({
            data: { point, stateId: room.gamestate.id }
        })

        res.status(200).json(CRUD.CREATED("OK", inserted))
    }, (e) => errorStatusFunc(res, e))
})

// Delete
router.delete("/:id", async (req, res) => {
    const inviteCode = req.params.id
    let { point } = req.query

    if (point != undefined && point < 0) {
        res.status(500).json(CRUD.ERROR("Point cannot be negative!"))
        return
    }

    if(point) point = parseInt(point)

    query(async (prisma) => {
        const node = await prisma.room.findUnique({
            where: { inviteCode },
            select: { gamestate: {
                select: { 
                    id: true,
                    nodes: {
                        where: { point }
                    } }
            } }
        })

        if (node == null || node.gamestate.nodes.length == 0) {
            res.status(204).send()
            return
        }

        if(point != undefined) {
            await prisma.pitchnode.delete({
                where: { id: node.gamestate.nodes[0].id }
            })
        } else {
            await prisma.pitchnode.deleteMany({
                where: { stateId: node.gamestate.id }
            })
        }

        res.status(200).json(CRUD.DELETED("OK"))
    }, (e) => errorStatusFunc(res, e))
})

export default router