import HospitalFloor from "../../../models/Hospital/HospitalFloor.js";
import HospitalRoom from "../../../models/Hospital/HospitalRoom.js";
import HospitalBed from "../../../models/Hospital/HospitalBed.js";
import BedAllotment from "../../../models/Hospital/BedAllotment.js";
import mongoose from "mongoose";

export const bedManagementList = async (req, res) => {
  const { doctorId } = req.query
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
          roomId: room._id,
          status: { $ne: "Deleted" }
        }).lean();

        const bedIds = beds.map(b => b._id);

        // 🔥 Active allotments
        const allotmentQuery = {
          hospitalId,
          bedId: { $in: bedIds },
          status: "Active"
        };

        if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
          const doctorObjectId = new mongoose.Types.ObjectId(doctorId);
          allotmentQuery.$or = [
            { primaryDoctorId: doctorObjectId },
            { "attendingStaff.staffId": doctorObjectId }
          ];
        }

        const allotments = await BedAllotment.find(allotmentQuery)
          .select("bedId")
          .populate('paymentId')
          .lean();

        const allotmentMap = {};
        allotments.forEach(a => {
          allotmentMap[a.bedId.toString()] = a._id;
        });

        let bedData = beds.map(bed => ({
          ...bed,
          allotmentId: allotmentMap[bed._id.toString()] || null
        }));

        if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
          bedData = bedData.filter(bed => bed.allotmentId !== null || bed.status === "Available");
        }

        if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId) || bedData.length > 0) {
          roomData.push({
            _id: room._id,
            roomName: room.roomName,
            department: room.departmentId?.departmentName || "",
            departmentId: room?.departmentId?._id || "",
            beds: bedData
          });
        }
      }

      if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId) || roomData.length > 0) {
        result.push({
          _id: floor._id,
          floorName: floor.floorName,
          rooms: roomData
        });
      }
    }

    res.json({ success: true, data: result });

  } catch (err) {
    console.error("bedManagementList error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load bed management"
    });
  }
};
