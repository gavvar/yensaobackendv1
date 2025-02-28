const sharp = require("sharp");
const path = require("path");

const optimizeImage = async (filePath) => {
  const optimizedPath = path.join(
    path.dirname(filePath),
    "optimized-" + path.basename(filePath)
  );

  await sharp(filePath)
    .resize(800, 800, { fit: "inside" })
    .webp({ quality: 80 })
    .toFile(optimizedPath);

  return optimizedPath;
};

module.exports = {
  optimizeImage,
};

//tom tat: file nay chua ham optimizeImage dung de resize va convert anh sang webp
//file nay duoc goi trong file image.controller.js
