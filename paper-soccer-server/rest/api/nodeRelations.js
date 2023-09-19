import express from "express"
import { CRUD, errorStatusFunc, getAll } from "../utils.js"
import { query } from "../../prisma/client.js"

const router = express.Router()

// Get all
router.get("/", (req, res) => {
    getAll("pitchnoderelation", req, res)
})

// Get for node
router.get("/:id", (req, res) => {
    const { page = 1, size = process.env.SQL_SELECTION_LIMIT } = req.query
    const pageSize = Math.max(1, Math.min(size, process.env.SQL_SELECTION_LIMIT))
    const toSkip = Math.max(0, (page - 1) * pageSize)

    const nodeId = parseInt(req.params.id)
    const { point } = req.query

    query(async (prisma) => {
        const node = await prisma.pitchnode.findUnique({
            where: { id: nodeId }
        })

        if (node == null) {
            res.status(204).send()
            return
        }

        const rels = await prisma.pitchnoderelation.findMany({
            skip: toSkip,
            take: pageSize,
            where: { nodeId: node.id, point }
        })

        if(rels.length == 0) {
            res.status(204).send()
            return
        }

        res.status(200).json(CRUD.READ("OK", rels))
    }, (e) => errorStatusFunc(res, e))
})

// Create
router.post("/:id", async (req, res) => {
    const nodeId = parseInt(req.params.id)
    const { point, creator=1 } = req.body;

    if (point == undefined) {
        res.status(500).json(CRUD.ERROR("No point specified in request body!"))
        return
    } else if (point < 0) {
        res.status(500).json(CRUD.ERROR("Point cannot be negative!"))
        return
    }

    query(async (prisma) => {
        const node = await prisma.pitchnode.findUnique({
            where: { id: nodeId }
        })

        if(node == null) {
            res.status(500).json(CRUD.ERROR("No node exists with this pitch node ID"))
            return
        }

        if(node.point == point) {
            res.status(500).json(CRUD.ERROR("You cannot have a relation that depicts the node pointing to itself!"))
            return
        }

        const relationsFor = await prisma.pitchnoderelation.findMany({
            where: { nodeId }
        })

        if(relationsFor.length >= 8) {
            res.status(500).json(CRUD.ERROR("A node cannot have more than 8 relations!"))
            return
        }

        const duplicate = await prisma.pitchnoderelation.findFirst({
            where: { nodeId, point }
        })

        if (duplicate != null) {
            res.status(500).json(CRUD.ERROR("A node at this point already exists!"))
            return
        }

        const inserted = await prisma.pitchnoderelation.create({
            data: { point, creator, nodeId }
        })

        res.status(200).json(CRUD.CREATED("OK", inserted))
    }, (e) => errorStatusFunc(res, e))
})

// Delete
router.delete("/:id", async (req, res) => {
    const nodeId = parseInt(req.params.id)
    let { point } = req.query

    if (point != undefined && point < 0) {
        res.status(500).json(CRUD.ERROR("Point cannot be negative!"))
        return
    }

    if(point) point = parseInt(point)

    query(async (prisma) => {
        const node = await prisma.pitchnode.findFirst({
            where: { id: nodeId }
        })

        if (node == null) {
            res.status(500).json(CRUD.ERROR("No node exists with this pitch node ID"))
            return
        }

        if (point != undefined) {
            const relationAtPoint = await prisma.pitchnoderelation.findFirst({
                where: { nodeId, point }
            })

            if(relationAtPoint == null) {
                res.status(500).json(CRUD.ERROR("This node doesn't have a relation with this point!"))
                return
            }

            await prisma.pitchnoderelation.delete({
                where: { id: relationAtPoint.id }
            })
        } else {
            await prisma.pitchnoderelation.deleteMany({
                where: { nodeId }
            })
        }

        res.status(200).json(CRUD.DELETED("OK"))
    }, (e) => errorStatusFunc(res, e))
})

export default router