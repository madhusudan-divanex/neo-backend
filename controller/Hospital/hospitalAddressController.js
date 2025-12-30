import HospitalAddress from "../../models/Hospital/HospitalAddress.js";

export const saveAddress = async (req, res) => {
  try {
    let address = await HospitalAddress.findOne({
      hospitalId: req.user.created_by_id
    });

    if (!address) {
      address = new HospitalAddress({
        hospitalId: req.user.created_by_id
      });
    }

    Object.assign(address, req.body);

    await address.save();

    res.json({ message: "Address saved", address });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
