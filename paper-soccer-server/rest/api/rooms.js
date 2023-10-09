import express from "express"
import codeGenerator from "voucher-code-generator"
import { GAME_MODE } from "../../../paper-soccer/src/constants.js"
import { CRUD, errorStatusFunc, getAll } from "../utils.js"
import { query } from "../../prisma/client.js"

const router = express.Router()

// Get all
router.get("/", (req, res) => {
    getAll("room", req, res)
})

// Get one
router.get("/:id", (req, res) => {
    const inviteCode = req.params.id

    query(async (prisma) => {
        const one = await prisma.room.findUnique({
            where: { inviteCode }
        })

        if (one == null) {
            res.status(204).send()
            return
        }

        res.status(200).json(CRUD.READ("OK", one))
    }, (e) => errorStatusFunc(res, e))
})

// Create
router.post("/", async (req, res) => {
    const { gameMode=GAME_MODE.CLASSIC } = req.body
    const inviteCode = codeGenerator.generate()[0]

    if (!Object.keys(GAME_MODE).includes(gameMode)) {
        res.status(500).json(CRUD.ERROR(`Invalid game mode value! Valid options: ${Object.keys(GAME_MODE).join(", ")}`))
        return
    }

    query(async (prisma) => {
        await prisma.room.create({
            data: {
                inviteCode,
                gamestate: {
                    create: { mode: gameMode }
                }
            }
        })

        const room = await prisma.room.findUnique({
            where: { inviteCode },
            include: { gamestate: true }
        })

        res.status(200).json(CRUD.CREATED("OK", room))
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
        const room = await prisma.room.findUnique({
            where: { inviteCode },
            select: { id: true }
        })

        if(room == null) {
            res.status(204).json()
            return
        }

        await prisma.room.update({
            where: { id: room.id },
            data: req.body
        })

        const updated = await prisma.room.findUnique({
            where: { id: room.id }
        })

        res.status(200).json(CRUD.UPDATED("OK", updated))
    }, (e) => errorStatusFunc(res, e))
})

// Delete one
router.delete("/:id", async (req, res) => {
    const inviteCode = req.params.id

    query(async (prisma) => {
        const room = await prisma.room.findUnique({
            where: { inviteCode },
            select: { id: true }
        })

        if (room == null) {
            res.status(204).json()
            return
        }

        await prisma.gamestate.delete({
            where: { roomId: room.id }
        })

        await prisma.room.delete({
            where: { id: room.id }
        })

        res.status(200).json(CRUD.DELETED("OK"))
    }, (e) => errorStatusFunc(res, e))
})

export default router