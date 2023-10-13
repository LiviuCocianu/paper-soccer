import { Socket, io } from 'socket.io-client'

class SocketClient {
    /**
     * @type {Socket}
     */
    socket

    connect(room, username) {
        this.socket = io(`${import.meta.env.VITE_SERVER_ADDRESS}:${import.meta.env.VITE_SERVER_PORT}`, {
            query: `room=${room}&username=${username}`
        })

        return new Promise((resolve, reject) => {
            this.socket.on('connect', () => resolve())
            this.socket.on('connect_error', (error) => reject(error))
        })
    }

    disconnect() {
        return new Promise((resolve) => {
            this.socket.disconnect()
            resolve()
        })
    }

    emit(event, data) {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject('No socket connection.')

            return this.socket.emit(event, data, (response) => {
                if (response.error) {
                    console.error(response.error)
                    return reject(response.error)
                }

                return resolve()
            })
        })
    }

    on(event, fun) {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject('No socket connection.')

            this.socket.on(event, fun)
            resolve()
        })
    }
}

export default SocketClient