// src/config/redis.js
import { createClient } from "redis";

// Kiểm tra môi trường - chỉ dùng Redis thật trong production
const useMockRedis =
  process.env.NODE_ENV !== "production" ||
  process.env.USE_MOCK_REDIS === "true";

// Mock Redis implementation
const storage = new Map();
const expiries = new Map();

// Tạo một Redis client giả đơn giản
console.log("⚠️ Using simple mock Redis implementation");

const redis = {
  set: async (key, value, options = {}) => {
    // Hỗ trợ cả hai cách truyền options
    let expiry = null;

    if (typeof options === "object" && options.EX) {
      expiry = Date.now() + options.EX * 1000;
    } else if (options === "EX" && arguments[3]) {
      expiry = Date.now() + arguments[3] * 1000;
    }

    // Lưu giá trị
    if (typeof value === "object") {
      storage.set(key, JSON.stringify(value));
    } else {
      storage.set(key, value);
    }

    // Lưu thời gian hết hạn nếu có
    if (expiry) {
      expiries.set(key, expiry);
    }

    return "OK";
  },

  get: async (key) => {
    // Kiểm tra hết hạn
    if (expiries.has(key) && expiries.get(key) < Date.now()) {
      storage.delete(key);
      expiries.delete(key);
      return null;
    }

    const value = storage.get(key);

    // Thử parse JSON nếu giá trị là chuỗi JSON
    if (
      value &&
      typeof value === "string" &&
      (value.startsWith("{") || value.startsWith("["))
    ) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }

    return value;
  },

  del: async (key) => {
    const keys = Array.isArray(key) ? key : [key];
    let count = 0;

    keys.forEach((k) => {
      if (storage.delete(k)) {
        expiries.delete(k);
        count++;
      }
    });

    return count;
  },

  keys: async (pattern) => {
    const keys = [];
    const regex = new RegExp(pattern.replace("*", ".*"));

    for (const key of storage.keys()) {
      if (regex.test(key)) {
        // Kiểm tra hết hạn
        if (expiries.has(key) && expiries.get(key) < Date.now()) {
          storage.delete(key);
          expiries.delete(key);
        } else {
          keys.push(key);
        }
      }
    }

    return keys;
  },

  exists: async (key) => {
    // Kiểm tra hết hạn
    if (expiries.has(key) && expiries.get(key) < Date.now()) {
      storage.delete(key);
      expiries.delete(key);
      return 0;
    }

    return storage.has(key) ? 1 : 0;
  },
};

// Log database size mỗi phút để debug
setInterval(() => {
  console.log(`Mock Redis has ${storage.size} keys in memory`);
}, 60000);

export default redis;
