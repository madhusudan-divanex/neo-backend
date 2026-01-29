import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import LabAddress from "../../models/Laboratory/labAddress.model.js";

export const saveAddress = async (req, res) => {
  try {
    const userId = req.user.id
    let address = await HospitalAddress.findOne({
      hospitalId: req.user.created_by_id
    });
    const addressData = req.body

    if (!address) {
      address = new HospitalAddress({
        hospitalId: req.user.created_by_id
      });
    }

    Object.assign(address, req.body);

    await address.save();

    if (address) {
      await LabAddress.findOneAndUpdate({userId:userId}, {
        fullAddress: addressData.fullAddress,
        cityId: addressData.city,
        stateId: addressData.state,
        countryId: addressData.country,
        pinCode: addressData.pinCode
      }, { new: true })
    }

    res.json({ message: "Address saved", address });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Server error" });
  }
};
