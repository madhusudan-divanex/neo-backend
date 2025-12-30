import HospitalContact from "../../models/Hospital/HospitalContact.js";
import { saveToGrid } from "../../services/gridfsService.js";

export const saveContact = async (req, res) => {
  try {
    let contact = await HospitalContact.findOne({
      hospitalId: req.user.created_by_id
    });

    if (!contact) {
      contact = new HospitalContact({
        hospitalId: req.user.created_by_id
      });
    }

    Object.assign(contact, req.body);

    if (req.file) {
      const file = await saveToGrid(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      contact.profilePhotoId = file._id.toString();
    }

    await contact.save();

    res.json({ message: "Contact saved", contact });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
