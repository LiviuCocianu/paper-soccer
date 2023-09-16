import express from "express"
import rooms from "./rooms.js"
import gameState from "./gameStates.js"
import nodes from "./nodes.js"
import nodeRelations from "./nodeRelations.js"
import players from "./players.js"

const router = express.Router()

router.use("/rooms", rooms)
router.use("/gameState", gameState)
router.use("/nodes", nodes)
router.use("/nodeRelations", nodeRelations)
router.use("/players", players)

export default router