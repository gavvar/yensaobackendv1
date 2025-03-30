/**
 * Lấy danh sách đơn vị vận chuyển
 */
export const getShippingProviders = (req, res) => {
  const shippingProviders = [
    { id: "ghn", name: "Giao hàng nhanh", logo: "ghn.svg" },
    { id: "ghtk", name: "Giao hàng tiết kiệm", logo: "ghtk.svg" },
    { id: "vnpost", name: "VNPost", logo: "vnpost.svg" },
    { id: "jt", name: "J&T Express", logo: "jt.svg" },
  ];

  return res.status(200).json({
    success: true,
    data: shippingProviders,
  });
};

/**
 * Tính phí vận chuyển dựa trên địa chỉ và trọng lượng
 */
export const calculateShippingFee = (req, res, next) => {
  try {
    const { address, weight, shippingProviderId } = req.body;

    // Logic tính phí vận chuyển đơn giản
    // Trong thực tế, bạn có thể tích hợp API bên thứ ba (GHN, GHTK, v.v.)
    let fee = 30000; // Phí vận chuyển mặc định

    // Tính phí dựa trên trọng lượng (giả định)
    if (weight) {
      if (weight > 10) {
        fee += (weight - 10) * 5000;
      }
    }

    // Phân biệt theo khu vực (giả định)
    if (address && typeof address === "string") {
      const addressLower = address.toLowerCase();

      // Phụ phí cho khu vực xa
      if (addressLower.includes("hà nội") || addressLower.includes("hanoi")) {
        fee += 0; // Không phụ phí
      } else if (
        addressLower.includes("hồ chí minh") ||
        addressLower.includes("ho chi minh") ||
        addressLower.includes("saigon")
      ) {
        fee += 0; // Không phụ phí
      } else {
        fee += 10000; // Phụ phí khu vực khác
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        fee,
        currency: "VND",
        provider: shippingProviderId || "ghn",
        estimatedDeliveryTime: "3-5 ngày làm việc",
      },
    });
  } catch (error) {
    next(error);
  }
};
