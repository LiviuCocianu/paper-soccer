export const GAME_STATUS = {
    WAITING: "WAITING", 
    STARTING: "STARTING", 
    ONGOING: "ONGOING", 
    FINISHED: "FINISHED", 
    SUSPENDED: "SUSPENDED", 
    REDUNDANT: "REDUNDANT"
}

export const GAME_MODE = {
    CLASSIC: "CLASSIC",
    BESTOF3: "BESTOF3"
}

export const SOCKET_EVENT = {
    PLAYER_ERROR: "player:error"
}

Object.freeze(GAME_STATUS)
Object.freeze(GAME_MODE)
Object.freeze(SOCKET_EVENT)