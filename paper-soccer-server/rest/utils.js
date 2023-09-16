import pool from "../database/index.js"

export const getAll = (table, req, res) => {
    const { page = 1, size = process.env.SQL_SELECTION_LIMIT } = req.query
    const pageSize = Math.max(1, Math.min(size, process.env.SQL_SELECTION_LIMIT))

    selectQuery(`SELECT * FROM ${table} 
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
    `, [], res)
}

export const selectQuery = async (query, values = [], res) => {
    return pool.promise().query(query, values)
        .then(([rows]) => {
            if (rows.length == 0) res.status(204).json()
            else res.status(200).json(CRUD.READ("OK", rows))
        }).catch((err) => {
            res.status(500).json(CRUD.ERROR(err.message))
        })
}

export const CRUD = {
    ERROR: (error) => ({ error }),
    CREATED: (message, posted) => ({ message, posted }),
    READ: (message, rows) => ({ message, rows }),
    UPDATED: (message, updated) => ({ message, updated }),
    DELETED: (message) => ({ message })
}

Object.freeze(CRUD)