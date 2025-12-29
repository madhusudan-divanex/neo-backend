import Favorite from "../../models/Patient/favorite.model.js"

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
    const  userId = req.params.id;
    if (!userId) {
        return res.status(400).json({ message: "userId is required", success: false });
    }
    const {limit=10,page=1}=req.query
    try {
        // Find existing favorite matching userId + any of labId, hospitalId, doctorId
        const myFavroite = await Favorite.find({userId}).sort({createdAt:-1}).limit(limit).skip((page-1)*limit);
        return res.status(200).json({ message: "Favorite saved",data:myFavroite, success: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
}


export {favoriteController,getPatientFavorite}