import Favorite from "../../models/Patient/favorite.model.js"
import Rating from "../../models/Rating.js";

async function favoriteController(req, res) {
    const { userId, labId, hospitalId, doctorId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "userId is required", success: false });
    }

    try {
        // Find existing favorite matching userId + any of labId, hospitalId, doctorId
        const isAlready = await Favorite.findOne({
            userId,
            labId: labId || null,
            hospitalId: hospitalId || null,
            doctorId: doctorId || null,
        });

        if (isAlready) {
            await Favorite.findByIdAndDelete(isAlready._id);
            return res.status(200).json({ message: "Removed from favorite", success: true });
        }

        await Favorite.create({ userId, labId, hospitalId, doctorId });
        return res.status(200).json({ message: "Favorite saved", success: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
}
async function getPatientFavorite(req, res) {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({ message: "userId is required", success: false });
    }
    const { limit = 10, page = 1 } = req.query
    try {
        // Find existing favorite matching userId + any of labId, hospitalId, doctorId
        const myFavroite = await Favorite.find({ userId }).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit);
        return res.status(200).json({ message: "Favorite saved", data: myFavroite, success: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
}
async function getMyRating(req, res) {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({
            message: "userId is required",
            success: false,
        });
    }

    const { type = "" } = req.query;

    try {
        const filter = { patientId: userId };

        // filter by rating type
        if (type === "lab") {
            filter.labId = { $ne: null };
        } else if (type === "doctor") {
            filter.doctorId = { $ne: null };
        } else if (type === "pharmacy") {
            filter.pharId = { $ne: null };
        }

        const myRatings = await Rating.find(filter)
            .sort({ createdAt: -1 })
            // .populate("doctorId labId pharId patientId",'name');

        return res.status(200).json({
            message: "Ratings fetched successfully",
            data: myRatings,
            success: true,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
}
async function getPatientFavoriteData(req, res) {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({
      message: "userId is required",
      success: false
    });
  }

  const { limit = 10, page = 1, type } = req.query;

  try {
    let filter = { userId };

    // 🔹 type based filtering
    if (type === "lab") {
      filter.labId = { $ne: null };
    } else if (type === "hospital") {
      filter.hospitalId = { $ne: null };
    } else if (type === "doctor") {
      filter.doctorId = { $ne: null };
    }
     const [labCount, hospitalCount, doctorCount] = await Promise.all([
      Favorite.countDocuments({ userId, labId: { $ne: null } }),
      Favorite.countDocuments({ userId, hospitalId: { $ne: null } }),
      Favorite.countDocuments({ userId, doctorId: { $ne: null } })
    ]);
    const myFavorite = await Favorite.find(filter)
      .populate({
        path: "labId",
        populate: { path: "labId" }
      })
      .populate({
        path: "hospitalId",
        populate: { path: "hospitalId" }
      })
      .populate({
        path: "doctorId",
        populate: { path: "doctorId" }
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit)
      .lean();

    return res.status(200).json({
      message: "Favorite data fetched",
      data: myFavorite,
      success: true,
      counts: {
        lab: labCount,
        hospital: hospitalCount,
        doctor: doctorCount
      },
      pagination: {
        currentPage: Number(page),
        limit: Number(limit)
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    });
  }
}


export { favoriteController, getPatientFavorite ,getMyRating,getPatientFavoriteData}