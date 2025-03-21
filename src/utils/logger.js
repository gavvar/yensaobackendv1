import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");

// Đảm bảo thư mục logs tồn tại
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logToFile = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data,
  };

  const logFile = path.join(LOG_DIR, `${level}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");
};

export const logger = {
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data);
    logToFile("info", message, data);
  },

  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error);
    logToFile("error", message, { error: error?.message, stack: error?.stack });
  },

  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data);
    logToFile("warn", message, data);
  },

  debug: (message, data) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, data);
      logToFile("debug", message, data);
    }
  },
};

export default logger;
