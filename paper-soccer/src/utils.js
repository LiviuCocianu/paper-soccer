const serverHttp = `${import.meta.env.VITE_SERVER_ADDRESS}:${import.meta.env.VITE_SERVER_PORT}`

export async function fetchRequest(endpoint, type="GET", body={}) {
    return await fetch(serverHttp + endpoint, {
        method: type,
        headers: type == "POST" || type == "PATCH" ? {
            "Content-Type": "application/json"
        } : undefined,
        body: type == "POST" || type == "PATCH" ? JSON.stringify(body) : undefined
    })
}

export function decodeQueryParam(p) {
    return decodeURIComponent(p.replace(/\+/g, " "))
}

export function flipPlayer(n) {
    return n == 1 ? 2 : 1
}

export const snooze = (delay) => new Promise((resolve) => setTimeout(resolve, delay))