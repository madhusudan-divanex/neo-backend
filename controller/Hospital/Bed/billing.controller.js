import BedAllotment from "../../../models/Hospital/BedAllotment.js";

const calculateStayAmount = async (req, res) => {
  const allotment = await BedAllotment
    .findById(req.params.allotmentId)
    .populate("bedId");

  const start = new Date(allotment.allotmentDate);
  const end = allotment.dischargeDate
    ? new Date(allotment.dischargeDate)
    : new Date();

  const days = Math.max(
    1,
    Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  );

  const amount = days * allotment.bedId.pricePerDay;

  res.json({
    success: true,
    days,
    pricePerDay: allotment.bedId.pricePerDay,
    totalAmount: amount
  });
};
export default {calculateStayAmount}