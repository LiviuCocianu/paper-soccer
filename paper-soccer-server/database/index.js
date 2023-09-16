import mysql from "mysql2"

const pool = mysql.createPool({
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    connectionLimit: process.env.SQL_CON_LIMIT,
    waitForConnections: true,
    enableKeepAlive: true,
})

export function setupMySQL() {
    pool.getConnection((err, conn) => {
        if (err) {
            console.log("Couldn't connect to database:", err.message)
            return
        }

        conn.query(`CREATE TABLE IF NOT EXISTS Player(
            id VARCHAR(20) PRIMARY KEY,
            roomOrder TINYINT UNSIGNED DEFAULT 1 NOT NULL,
            username VARCHAR(16) NOT NULL DEFAULT 'Player',
            score SMALLINT UNSIGNED NOT NULL,
            invitedTo VARCHAR(8) NOT NULL
        )`, (err) => {
            if (err) throw err
        })

        conn.query(`CREATE TABLE IF NOT EXISTS GameState(
            id INTEGER AUTO_INCREMENT PRIMARY KEY,
            activePlayer TINYINT UNSIGNED DEFAULT 1 NOT NULL,
            status ENUM('WAITING', 'STARTING', 'ONGOING', 'FINISHED', 'SUSPENDED', 'REDUNDANT') DEFAULT 'WAITING' NOT NULL,
            mode ENUM('CLASSIC', 'BESTOF3') DEFAULT 'CLASSIC' NOT NULL,
            ballPosition SMALLINT UNSIGNED DEFAULT 52 NOT NULL,
            countdownValue TINYINT UNSIGNED DEFAULT 3 NOT NULL,
            roomId INTEGER UNIQUE
        )`, (err) => {
            if (err) throw err
        })

        conn.query(`CREATE TABLE IF NOT EXISTS Room(
            id INT AUTO_INCREMENT PRIMARY KEY,
            inviteCode VARCHAR(8) UNIQUE NOT NULL,
            stateId INTEGER UNIQUE
        )`, (err) => {
            if (err) throw err
        })

        conn.query(`CREATE TABLE IF NOT EXISTS PitchNode(
            id INT AUTO_INCREMENT PRIMARY KEY,
            point INTEGER UNSIGNED NOT NULL,
            stateId INTEGER NOT NULL,
            UNIQUE KEY uniquePoint (point, stateId)
        )`, (err) => {
            if (err) throw err
        })

        conn.query(`CREATE TABLE IF NOT EXISTS PitchNodeRelation(
            id INT AUTO_INCREMENT PRIMARY KEY,
            point INTEGER UNSIGNED NOT NULL,
            creator TINYINT UNSIGNED NOT NULL DEFAULT 1,
            pitchNodeId INTEGER NOT NULL,
            UNIQUE KEY uniqueRelation (point, pitchNodeId),
            CONSTRAINT c_noRelToSelf CHECK (point <> pitchNodeId)
        )`, (err) => {
            if (err) throw err
        })

        conn.query("ALTER TABLE Player ADD FOREIGN KEY (invitedTo) REFERENCES Room (inviteCode)", (err) => {
            if (err) throw err
        })

        conn.query("ALTER TABLE GameState ADD FOREIGN KEY (roomId) REFERENCES Room (id)", (err) => {
            if (err) throw err
        })

        conn.query("ALTER TABLE Room ADD FOREIGN KEY (stateId) REFERENCES GameState (id)", (err) => {
            if (err) throw err
        })

        conn.query("ALTER TABLE PitchNode ADD FOREIGN KEY (stateId) REFERENCES GameState (id)", (err) => {
            if (err) throw err
        })

        conn.query("ALTER TABLE PitchNodeRelation ADD FOREIGN KEY (pitchNodeId) REFERENCES PitchNode (id)", (err) => {
            if (err) throw err
        })

        pool.releaseConnection(conn)

        console.log("Database setup was successful!");
    })
}

export default pool