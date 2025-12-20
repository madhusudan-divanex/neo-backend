import HospitalFloor from "../../../models/Hospital/HospitalFloor.js";
import HospitalRoom from "../../../models/Hospital/HospitalRoom.js";
import HospitalBed from "../../../models/Hospital/HospitalBed.js";
import BedAllotment from "../../../models/Hospital/BedAllotment.js";

const bedManagementList = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    const floors = await HospitalFloor.find({
      hospitalId,
      status: "Active"
    });

    const result = [];

    for (const floor of floors) {
      const rooms = await HospitalRoom.find({
        hospitalId,
        floorId: floor._id,
        status: "Active"
      }).populate("departmentId", "departmentName");

      const roomData = [];

      for (const room of rooms) {
        const beds = await HospitalBed.find({
          hospitalId,
          roomId: room._id
        }).lean(); // 👈 IMPORTANT

        const bedIds = beds.map(b => b._id);

        // 🔥 Fetch active allotments for these beds
        const allotments = await BedAllotment.find({
          hospitalId,
          bedId: { $in: bedIds },
          status: "Active"
        }).select("bedId").lean();

        // Map bedId => allotmentId
        const allotmentMap = {};
        allotments.forEach(a => {
          allotmentMap[a.bedId.toString()] = a._id;
        });

        const bedData = beds.map(bed => ({
          ...bed,
          allotmentId: allotmentMap[bed._id.toString()] || null
        }));

        roomData.push({
          _id: room._id,
          roomName: room.roomName,
          department: room.departmentId?.departmentName || "",
          beds: bedData
        });
      }

      result.push({
        _id: floor._id,
        floorName: floor.floorName,
        rooms: roomData
      });
    }

    res.json({ success: true, data: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load bed management"
    });
  }
};

export default {bedManagementList}