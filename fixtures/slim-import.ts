// Fixture for testing slim zario/logger import
import { Logger } from "zario/logger";

const logger = new Logger({ level: "info" });
logger.info("test");
