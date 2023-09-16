import "dotenv/config"

import { setupMySQL} from "./database/index.js"
import { setupExpressApp } from "./rest/index.js";
import { setupSocketIO } from "./socket/index.js";

// Setup database
setupMySQL()

// Setup Express app
setupExpressApp()

// Setup Socket.IO server
setupSocketIO()
