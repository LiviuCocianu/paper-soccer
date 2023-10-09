import express from "express"
import { CRUD, errorStatusFunc, getAll } from "../utils.js"
import { query } from "../../prisma/client.js"

const router = express.Router()

// Get all
router.get("/", (req, res) => {
    getAll("player", req, res)
})

// Get for room
router.get("/:id", (req, res) => {
    const inviteCode = req.params.id

    query(async (prisma) => {
        const roomExists = await prisma.room.findUnique({
            where: { inviteCode }
        })

        if (roomExists == null) {
            res.status(204).send()
            return
        }

        const player = await prisma.player.findMany({
            where: { invitedTo: inviteCode }
        })

        res.status(200).json(CRUD.READ("OK", player))
    }, (e) => errorStatusFunc(res, e))
})

// Create
router.post("/", async (req, res) => {
    const { id, username, invitedTo } = req.body

    if (!id) {
        res.status(400).json(CRUD.ERROR("No ID specified in request body!"))
        return
    } else if (id.length != 20) {
        res.status(400).json(CRUD.ERROR("ID must be 20 characters long!"))
        return
    }

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

    query(async (prisma) => {
        const roomExists = await prisma.room.findUnique({
            where: { inviteCode: invitedTo }
        })

        if (roomExists == null) {
            res.status(400).json(CRUD.ERROR("No room corresponding to this invite code was found!"))
            return
        }

        const playerCount = await prisma.player.count({
            where: { invitedTo }
        })

        if(playerCount == 2) {
            res.status(500).json(CRUD.ERROR("Room corresponding to this invite code is full!"))
            return
        }

        const roomOrder = playerCount + 1

        await prisma.player.create({
            data: { id, roomOrder, invitedTo, username }
        })

        const player = await prisma.player.findUnique({
            where: { id }
        })

        res.status(200).json(CRUD.CREATED("OK", player))
    }, (e) => errorStatusFunc(res, e))
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

    query(async (prisma) => {
        const playerExists = await prisma.player.findUnique({
            where: { id }
        })

        if (playerExists == null) {
            res.status(204).json()
            return
        }

        await prisma.player.update({
            where: { id },
            data: req.body
        })

        const updated = await prisma.player.findUnique({
            where: { id }
        })

        res.status(200).json(CRUD.UPDATED("OK", updated))
    }, (e) => errorStatusFunc(res, e))
})

// Delete one
router.delete("/:id", async (req, res) => {
    const id = req.params.id

    query(async (prisma) => {
        const playerExists = await prisma.player.findUnique({
            where: { id }
        })

        if (playerExists == null) {
            res.status(204).json()
            return
        }

        const deleted = await prisma.player.delete({
            where: { id }
        })

        if(!deleted) return

        const playerCount = await prisma.player.count({
            where: { invitedTo: deleted.invitedTo }
        })

        if(playerCount == 0) {
            await prisma.room.delete({
                where: { inviteCode: deleted.invitedTo }
            })

            res.status(200).json(CRUD.DELETED("OK! Deleted room: unused"))
        } else {
            res.status(200).json(CRUD.DELETED("OK"))
        }

    }, (e) => errorStatusFunc(res, e))
})

export default router