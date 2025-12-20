import HospitalContact from "../../models/Hospital/HospitalContact.js";
import { saveToGrid } from "../../services/gridfsService.js";

const saveContact = async (req, res) => {
    try {
        let contact = await HospitalContact.findOne({ hospitalId: req.user.hospitalId });

        if (!contact) {
            contact = new HospitalContact({ hospitalId: req.user.hospitalId });
        }

        Object.assign(contact, req.body);

        if (req.file) {
            const file = await saveToGrid(req.file.buffer, req.file.originalname, req.file.mimetype);
            contact.profilePhotoId = file._id.toString();
        }

        await contact.save();

        res.json({ message: "Contact saved", contact });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
export default {saveContact}