import express from "express"
import { CRUD, errorStatusFunc, getAll } from "../utils.js"
import { query } from "../../prisma/client.js"

const router = express.Router()

// Get all
router.get("/", (req, res) => {
    getAll("gamestate", req, res)
})

// Get one
router.get("/:id", async (req, res) => {
    const inviteCode = req.params.id

    query(async (prisma) => {
        const roomExists = await prisma.room.findUnique({
            where: { inviteCode },
            select: { id: true }
        })

        if (roomExists == null) {
            res.status(204).send()
            return
        }

        const state = await prisma.gamestate.findUnique({
            where: { roomId: roomExists.id }
        })

        res.status(200).json(CRUD.READ("OK", state))
    }, (e) => errorStatusFunc(res, e))
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

    query(async (prisma) => {
        const roomExists = await prisma.room.findUnique({
            where: { inviteCode },
            select: { id: true }
        })

        if (roomExists == null) {
            res.status(204).send()
            return
        }

        await prisma.gamestate.update({
            where: { roomId: roomExists.id },
            data: req.body
        })

        const updated = await prisma.gamestate.findUnique({
            where: { roomId: roomExists.id}
        })

        res.status(200).json(CRUD.UPDATED("OK", updated))
    }, (e) => errorStatusFunc(res, e))
})

// Delete
router.delete("/", (req, res) => {
    res.status(400).json(CRUD.ERROR("Game state can only be deleted through Room's DELETE endpoint"))
})

router.delete("/:id", (req, res) => {
    res.status(400).json(CRUD.ERROR("Game state can only be deleted through Room's DELETE endpoint"))
})

export default router