import HospitalAddress from "../../models/Hospital/HospitalAddress.js";

const saveAddress = async (req, res) => {
    try {
        let address = await HospitalAddress.findOne({ hospitalId: req.user.hospitalId });

        if (!address) {
            address = new HospitalAddress({ hospitalId: req.user.hospitalId });
        }

        Object.assign(address, req.body);

        await address.save();

        res.json({ message: "Address saved", address });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export default {saveAddress}
