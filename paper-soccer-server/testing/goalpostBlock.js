import { findNodeByGridLocation, isGoalpostBlocked } from "../game/utils.js"
import { query } from "../prisma/client.js"

async function createRelation(prisma, stateId, first, second) {
    if (!first || !second) {
        console.log("Create relation failed: first or second position undefined")
        return
    }

    const firstCount = await prisma.pitchnode.count({
        where: { stateId, point: first.point }
    })

    const secondCount = await prisma.pitchnode.count({
        where: { stateId, point: second.point }
    })

    let firstNode
    let secondNode

    if (firstCount == 0) {
        firstNode = await prisma.pitchnode.create({
            data: { stateId, point: first.point }
        })
    } else {
        firstNode = await prisma.pitchnode.findFirst({
            where: { stateId, point: first.point }
        })
    }

    if (secondCount == 0) {
        secondNode = await prisma.pitchnode.create({
            data: { stateId, point: second.point }
        })
    } else {
        secondNode = await prisma.pitchnode.findFirst({
            where: { stateId, point: second.point }
        })
    }

    await prisma.pitchnoderelation.createMany({
        data: [
            { nodeId: firstNode.id, point: second.point, creator: 1 },
            { nodeId: secondNode.id, point: first.point, creator: 1 }
        ]
    })
}

export async function testGoalpostBlock(stateId) {
    await query(async (prisma) => {
        // Phase 1
        for (let i = 2; i < 5; i++) {
            const first = findNodeByGridLocation(2, i)
            const second = findNodeByGridLocation(1, i + 1)

            await createRelation(prisma, stateId, first, second)
        }

        // Phase 2
        for (let i = 3; i < 6; i++) {
            const first = findNodeByGridLocation(1, i)
            const second = findNodeByGridLocation(2, i + 1)

            await createRelation(prisma, stateId, first, second)
        }

        // Phase 3
        for (let i = 3; i < 6; i++) {
            const first = findNodeByGridLocation(1, i)
            const second = findNodeByGridLocation(2, i)

            await createRelation(prisma, stateId, first, second)
        }

        // Phase 4
        for (let i = 2; i < 6; i++) {
            const first = findNodeByGridLocation(2, i)
            const second = findNodeByGridLocation(2, i + 1)

            await createRelation(prisma, stateId, first, second)
        }
    }, (e) => console.log(e))

    const blocked = await isGoalpostBlocked(stateId)

    console.log("")
    console.log("Red goalpost is blocked:", blocked)
}