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
    PLAYER_ERROR: "player:error",
    PLAYER_NAME_UPDATED: "player:name:updated",
    PLAYER_SCORE_UPDATED: "player:score:updated",
    PLAYER_ROOM_ORDER: "player:room_order",
    GAMESTATE_STATUS_UPDATED: "gamestate:status:updated",
    GAMESTATE_COUNTDOWN_UPDATED: "gamestate:countdown:updated"
}

Object.freeze(GAME_STATUS)
Object.freeze(GAME_MODE)
Object.freeze(SOCKET_EVENT)