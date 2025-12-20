import HospitalFloor from "../../../models/Hospital/HospitalFloor.js";

const addFloor = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { floorName } = req.body;

    if (!floorName) {
      return res.status(400).json({ success: false, message: "Floor name required" });
    }

    const floor = await HospitalFloor.create({
      hospitalId,
      floorName
    });

    res.json({ success: true, data: floor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const listFloors = async (req, res) => {
  const floors = await HospitalFloor.find({
    hospitalId: req.user.id,
    status: "Active"
  });
  res.json({ success: true, data: floors });
};

const deleteFloor = async (req, res) => {
  await HospitalFloor.findByIdAndUpdate(req.params.id, {
    status: "Inactive"
  });
  res.json({ success: true, message: "Floor removed" });
};
const getFloorById = async (req, res) => {
  try {
    const floor = await HospitalFloor.findOne({
      _id: req.params.id,
      hospitalId: req.user.id
    });

    if (!floor) {
      return res.status(404).json({
        success: false,
        message: "Floor not found"
      });
    }

    res.json({
      success: true,
      data: floor
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
const updateFloor = async (req, res) => {
  try {
    const { floorName } = req.body;

    const floor = await HospitalFloor.findOneAndUpdate(
      {
        _id: req.params.id,
        hospitalId: req.user.id
      },
      { floorName },
      { new: true }
    );

    if (!floor) {
      return res.status(404).json({
        success: false,
        message: "Floor not found"
      });
    }

    res.json({
      success: true,
      message: "Floor updated successfully",
      data: floor
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export default {addFloor,getFloorById,updateFloor,deleteFloor,listFloors}


