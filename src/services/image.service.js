import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { ValidationError } from "../utils/errors.js";

/**
 * Tối ưu hóa hình ảnh - resize và chuyển sang định dạng webp
 */
export const optimizeImage = async (filePath, options = {}) => {
  try {
    // Kiểm tra file tồn tại
    await fs.access(filePath);

    const {
      width = 800,
      height = 800,
      quality = 80,
      deleteOriginal = false,
    } = options;

    // Tạo tên file mới với định dạng webp
    const filename = path.basename(filePath, path.extname(filePath));
    const dir = path.dirname(filePath);
    const optimizedPath = path.join(dir, `${filename}.webp`);

    // Tối ưu hóa ảnh
    await sharp(filePath)
      .resize(width, height, { fit: "inside" })
      .webp({ quality })
      .toFile(optimizedPath);

    // Xóa file gốc nếu cần
    if (deleteOriginal) {
      await fs.unlink(filePath);
    }

    return optimizedPath;
  } catch (error) {
    throw new ValidationError(`Lỗi khi tối ưu hóa ảnh: ${error.message}`);
  }
};

/**
 * Tạo nhiều kích thước của một ảnh (thumbnails)
 */
export const generateImageVariants = async (filePath) => {
  try {
    // Kiểm tra file tồn tại
    await fs.access(filePath);

    const filename = path.basename(filePath, path.extname(filePath));
    const dir = path.dirname(filePath);

    // Tạo các biến thể với kích thước khác nhau
    const variants = {
      small: await sharp(filePath)
        .resize(300, 300, { fit: "inside" })
        .webp({ quality: 80 })
        .toFile(path.join(dir, `${filename}-300.webp`)),

      medium: await sharp(filePath)
        .resize(600, 600, { fit: "inside" })
        .webp({ quality: 80 })
        .toFile(path.join(dir, `${filename}-600.webp`)),

      large: await sharp(filePath)
        .resize(1200, 1200, { fit: "inside" })
        .webp({ quality: 80 })
        .toFile(path.join(dir, `${filename}-1200.webp`)),
    };

    return {
      small: path.join(dir, `${filename}-300.webp`),
      medium: path.join(dir, `${filename}-600.webp`),
      large: path.join(dir, `${filename}-1200.webp`),
    };
  } catch (error) {
    throw new ValidationError(`Lỗi khi tạo biến thể ảnh: ${error.message}`);
  }
};
