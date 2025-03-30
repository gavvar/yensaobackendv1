export const parseProductData = (req, res, next) => {
  try {
    console.log("--- Parse middleware ---");
    console.log("Body before:", JSON.stringify(req.body));

    if (req.body.productData && typeof req.body.productData === "string") {
      const parsedData = JSON.parse(req.body.productData);
      req.productData = parsedData;
      console.log("Parsed data:", JSON.stringify(parsedData));
    }

    console.log("Body after:", JSON.stringify(req.body));
    console.log("--------------------");
    next();
  } catch (error) {
    console.error("Parse error:", error);
    return res.status(400).json({
      success: false,
      error: "Dữ liệu sản phẩm không hợp lệ",
      details: error.message,
    });
  }
};
