
import mongoose from "mongoose";

const EducationSchema = new mongoose.Schema(
  {
    university: String,
    degree: String,
    yearFrom: String,
    yearTo: String
  },
  { _id: false }
);

const CertificateSchema = new mongoose.Schema(
  {
    certificateName: String,
    certificateFile: String
  },
  { _id: false }
);

const StaffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },  

      profileImage: String,
      name: { type: String, required: true },
      dob: Date,
      gender: { type: String, enum: ["male", "female", "other"] },
      address: String,
      countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
      stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
      cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
      pincode: String,
      contactNumber: String,
      email: String,
      emergencyContactName: String,
      emergencyContactPhone: String,
      profession: String,
      specialization: String,
      experience: String,
      bio: String,
      education: [EducationSchema],
      certificates: [CertificateSchema]
    


  },
  { timestamps: true }
);

export default mongoose.model("Staff", StaffSchema);
