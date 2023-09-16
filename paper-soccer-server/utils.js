import mysql from "mysql2"

export function composeUpdateSQL(table, valuesBody) {
    let out = `UPDATE ${table} SET `
    const values = []
    const entries = Object.entries(valuesBody)

    for (let i = 0; i < entries.length; i++) {
        const [key, val] = entries[i]

        out += "??=?"
        values.push(key)
        values.push(val)

        if(i < entries.length - 1) out += ", "
    }

    out = mysql.format(out, values)

    return out
}