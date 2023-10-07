import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Howl } from 'howler'

import GameScreenLayout from "../components/GameScreenLayout"
import { connectNodes, resetGameState, setActivePlayer, setBallPosition, setHistory, setStatus, setWon } from "../state/slices/gameSlice"
import { GAME_MODE, GAME_STATUS } from "../constants"
import GameServerEmulator from "../GameServerEmulator"
import { canMove, findNodeByGridLocation, findNodeByPoint, getDistance, getGoalpostAtBall, isGoalpostBlocked, isValidMove } from "../nodeUtils"
import { flipPlayer } from "../utils"


function OfflineGameScreen() {
    // Own state
    const [isBotBouncing, setBotBouncing] = useState(false)
    const [finishMessage, setFinishMessage] = useState("")
    const [scoreboard, setScoreboard] = useState({ 
        "1": { name: "You", score: 0 },
        "2": { name: "Bot", score: 0 } 
    })

    const winSound = useMemo(() => new Howl({
        src: ['../sounds/win.mp3'],
        volume: 0.5
    }), [])

    const loseSound = useMemo(() => new Howl({
        src: ['../sounds/lose.mp3'],
        volume: 0.5
    }), [])

    // Refs
    const nodesRef = useRef()
    const ballPosRef = useRef()
    const historyRef = useRef()

    // Redux state
    const { status, mode, nodes, history, ballPosition, activePlayer, won } = useSelector(state => state.game)
    const dispatch = useDispatch()

    const server = useMemo(() => new GameServerEmulator(dispatch), [dispatch])

    const handleNodeClick = useCallback((node) => {
        const isValid = isValidMove(nodes, node, { ballPosition, history, activePlayer })

        if (!isValid) {
            dispatch(setStatus(GAME_STATUS.FINISHED))
            dispatch(setWon(flipPlayer(activePlayer)))
            setFinishMessage(`${scoreboard[activePlayer].name} got the ball stuck`)
            console.log("test", ballPosition, activePlayer, node); // TODO debug
            return null
        }

        const clickedRelationsCount = history[node.point] ? history[node.point].length : 0

        // Calculate game-ending variables
        const bounceable = node.placement == "border" || clickedRelationsCount > 0
        const canMoveBall = canMove(nodes, activePlayer, { ballPosition: node.point, activePlayer, history })
        const inGoalpost = getGoalpostAtBall(node.point)
        const selfGoal = inGoalpost == activePlayer
        const redBlocked = isGoalpostBlocked(nodes, history)
        const blueBlocked = isGoalpostBlocked(nodes, history, false)

        // If the active player got the ball stuck or scored a goal in their own goalpost, they lose
        let winner = (!canMoveBall && !inGoalpost) || selfGoal
            ? flipPlayer(activePlayer)
            : activePlayer

        // Prepare game state columns to update at the end
        dispatch(setBallPosition(node.point))

        let activePl = activePlayer

        if (!bounceable) {
            activePl = flipPlayer(activePlayer)
            winner = redBlocked ? 1 : (blueBlocked ? 2 : winner)
        }

        dispatch(setWon(winner == 1))

        if (!canMoveBall || (!bounceable && (redBlocked || blueBlocked))) {
            dispatch(setStatus(GAME_STATUS.FINISHED))
        }

        if (inGoalpost) {
            setScoreboard(prev => ({
                ...prev,
                [winner]: {
                    ...prev[winner],
                    score: prev[winner].score + 1
                }
            }))

            switch (mode) {
                case GAME_MODE.CLASSIC: {
                    dispatch(setStatus(GAME_STATUS.FINISHED))

                    if (selfGoal) {
                        setFinishMessage(`${scoreboard[activePlayer].name} scored an own goal..`)
                    } else {
                        setFinishMessage(`Scored a goal for the ${winner == 1 ? "red" : "blue"} team!`)
                    }
                    break
                }
                case GAME_MODE.BESTOF3: {
                    // Place ball back in the center
                    dispatch(setBallPosition(52))

                    // Delete nodes and their relations
                    dispatch(setHistory({}))

                    const addUpTo3 = Object.values(scoreboard).map(pl => pl.score).reduce((prev, curr) => prev + curr) >= 3
                    const redundantMatch = Object.values(scoreboard).some(pl => pl.score == 2)

                    if (addUpTo3 || redundantMatch) {
                        dispatch(setStatus(GAME_STATUS.FINISHED))
                    }

                    if (addUpTo3) {
                        setFinishMessage(`Scored a goal for the ${winner == 1 ? "red" : "blue"} team!`)
                    }

                    if (redundantMatch) {
                        console.log(`${winner == 1 ? "Red" : "Blue"} team scored the most goals!`);
                    }
                    break
                }
            }
        } else if (!bounceable && (redBlocked || blueBlocked)) {
            setFinishMessage(`${scoreboard[winner].name} blocked the team goalpost, not allowing for any further goals`)
        } else if (!canMoveBall) {
            setFinishMessage(`${scoreboard[activePlayer].name} got the ball stuck`)
        }

        dispatch(setActivePlayer(activePl))

        if (activePl == 2) {
            setBotBouncing(bounceable)
        }

        dispatch(connectNodes({ from: ballPosition, to: node.point, creator: activePlayer }))

        return bounceable
    }, [activePlayer, ballPosition, history, mode, nodes, scoreboard, dispatch])

    /**
     * Get the node with the highest chance of leading to a win
     * 
     * @param {PitchNode[]} nodes All the existing nodes on the pitch, regardless of relations
     * @param {number} originPoint Origin point to check
     * @param {GameHistory} history Game history
     * 
     * @returns {PitchNode|null} Returns null if origin is out of bounds
     */
    const getOptimalNeighbour = (nodes, originPoint, history) => {
        const originNode = findNodeByPoint(nodes, originPoint)

        if (!originNode) return null

        const { x: ox, y: oy } = originNode.gridLocation
        const scoreMap = new Map()

        for (let i = oy - 1; i <= oy + 1; i++) {
            for (let j = ox - 1; j <= ox + 1; j++) {
                if (i == oy && j == ox) continue

                const node = findNodeByGridLocation(nodes, j, i)

                if (!node) continue

                const isValid = isValidMove(nodes, node, { activePlayer: 2, ballPosition: originPoint, history })

                if (isValid) {
                    // Calculate a score based on the distance from the player's goalpost, prioritizing bounceable nodes
                    const dist = getDistance(nodes, node, true)
                    const relCount = history[node.point] ? history[node.point].length : 0
                    const bounceable = node.placement == "border" || (relCount > 0 && relCount < 7)
                    // A shorter distance is the most desireable
                    const score = ((1 / dist) * 100) + (bounceable ? 100 : 0)

                    scoreMap.set(node.point, score)
                }
            }
        }

        // If there are no scores in the map, we can assume there are no available nodes to move towards,
        // so we're returning a corner node to artifically trigger a "game over" (moving towards the corner will get the ball stuck)
        if (scoreMap.size == 0) return findNodeByPoint(nodes, 0)

        // Get the highest score and get all nodes with the corresponding score
        const highestScore = Math.max(...Array.from(scoreMap.values()))
        const highestNodePoints = Array.from(scoreMap.entries())
            .filter(([, score]) => score == highestScore)
            .map(([point,]) => point)

        let optimalNode

        // If more nodes with the same score are found, choose one at random
        if (highestNodePoints.length > 1) {
            const rand = Math.floor(Math.random() * highestNodePoints.length);
            optimalNode = findNodeByPoint(nodes, highestNodePoints[rand])
        } else {
            optimalNode = findNodeByPoint(nodes, highestNodePoints[0])
        }

        return optimalNode
    }

    useEffect(() => {
        nodesRef.current = nodes
    }, [nodes])

    useEffect(() => {
        ballPosRef.current = ballPosition
    }, [ballPosition])

    useEffect(() => {
        historyRef.current = history
    }, [history])

    useEffect(() => {
        dispatch(setStatus(GAME_STATUS.STARTING))

        const cd = server.startCountdown(status)

        document.title = "Paper Soccer - Singleplayer VS Bot"

        return () => {
            clearInterval(cd)
            dispatch(resetGameState())
        }
    }, [])

    // When it's the bot's turn, have them make a move
    useEffect(() => {
        let bouncing = isBotBouncing

        do {
            if(activePlayer == 1 || status != GAME_STATUS.ONGOING) break

            const node = getOptimalNeighbour(nodesRef.current, ballPosRef.current, historyRef.current)
            const bounced = handleNodeClick(node)

            if(bounced == null) break

            if(!bounced) {
                setBotBouncing(false)
                bouncing = false
            }
        } while(bouncing)
    }, [status, activePlayer, isBotBouncing, handleNodeClick])

    // Sound effects
    useEffect(() => {
        if (status == GAME_STATUS.FINISHED || status == GAME_STATUS.SUSPENDED) {
            if (won) winSound.play()
            else loseSound.play()
        }
    }, [status, won, loseSound, winSound])

    return (
        <GameScreenLayout
            order={1}
            isLoading={false}
            isConnected={true}
            scoreboard={scoreboard}
            onNodeClick={handleNodeClick}
            finishMessage={finishMessage}
        />
    )
}

export default OfflineGameScreen