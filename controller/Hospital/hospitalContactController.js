import HospitalContact from "../../models/Hospital/HospitalContact.js";
import LabPerson from "../../models/Laboratory/contactPerson.model.js";
import { saveToGrid } from "../../services/gridfsService.js";
import { capitalizeFirst } from "../../utils/globalFunction.js";

export const saveContact = async (req, res) => {
  try {
    let contact = await HospitalContact.findOne({
      hospitalId: req.user.created_by_id
    });
    const userId = req.user.id
    const baseUrl = `api/file/`;
    const contactData = req.body
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
    if (contact) {
      await LabPerson.findOneAndUpdate({ userId: userId }, {
        name: contactData.name,
        email: contactData.email,
        contactNumber: contactData.mobileNumber,
        photo: baseUrl + contactData.profilePhotoId,
        gender: capitalizeFirst(contactData.gender)
      }, { new: true })
    }

    res.json({ message: "Contact saved", contact });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
