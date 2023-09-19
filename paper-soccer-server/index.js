import "dotenv/config"

import { setupExpressApp } from "./rest/index.js";
import { setupSocketIO } from "./socket/index.js";

// Setup Express app
setupExpressApp()

// Setup Socket.IO server
setupSocketIO()
