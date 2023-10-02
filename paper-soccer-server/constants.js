export const GAME_STATUS = {
    WAITING: "WAITING", 
    STARTING: "STARTING", 
    ONGOING: "ONGOING", 
    FINISHED: "FINISHED", 
    SUSPENDED: "SUSPENDED",
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
    GAMESTATE_BALL_POSITION_UPDATED: "gamestate:ball:updated",
    GAMESTATE_STATUS_UPDATED: "gamestate:status:updated",
    GAMESTATE_COUNTDOWN_UPDATED: "gamestate:countdown:updated",
    NODE_CLICKED: "node:clicked",
    NODE_CONNECTED: "node:connected"
}

export const PITCH_INFO = {
    NODE_COUNT: 105,
    RED_GOAL_NODES: [33, 46, 59],
    BLUE_GOAL_NODES: [45, 58, 71],
    CORNERS: [0, 10, 94, 104]
}

Object.freeze(GAME_STATUS)
Object.freeze(GAME_MODE)
Object.freeze(SOCKET_EVENT)
Object.freeze(PITCH_INFO)