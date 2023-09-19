import { query } from "../prisma/client.js"

export function errorStatusFunc(res, e) {
    res.status(500).json(CRUD.ERROR(e.message))
}

export function getAll(table, req, res) {
    const { page = 1, size = process.env.SQL_SELECTION_LIMIT } = req.query
    const pageSize = Math.max(1, Math.min(size, process.env.SQL_SELECTION_LIMIT))
    const toSkip = Math.max(0, (page - 1) * pageSize)

    query(async (prisma) => {
        const all = await prisma[table].findMany({
            skip: toSkip,
            take: pageSize
        })

        if (all.length == 0) {
            res.status(204).send()
            return
        }

        res.status(200).json(CRUD.READ("OK", all))
    }, (e) => errorStatusFunc(res, e))
}

export const CRUD = {
    ERROR: (error) => ({ error }),
    CREATED: (message, posted) => ({ message, posted }),
    READ: (message, result) => ({ message, result }),
    UPDATED: (message, updated) => ({ message, updated }),
    DELETED: (message) => ({ message })
}

Object.freeze(CRUD)