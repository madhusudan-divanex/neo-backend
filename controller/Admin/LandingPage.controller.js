import LandingPage from "../../models/Admin/LandingPage.js";
import PatientBanner from "../../models/Admin/PatientBanner.js";
import HospitalCategory from "../../models/HospitalCategory.js";
import FirstDoctor from "../../models/LandingPage.js/FirstDoctor.js";
import FirstHospital from "../../models/LandingPage.js/FirstHospital.js";
import FirstLab from "../../models/LandingPage.js/FirstLab.js";
import FirstMain from "../../models/LandingPage.js/FirstMain.js";
import FirstPatient from "../../models/LandingPage.js/FirstPatient.js";
import FirstPhar from "../../models/LandingPage.js/FirstPhar.js";
import FivethDoctor from "../../models/LandingPage.js/FivethDoctor.js";
import FivethLab from "../../models/LandingPage.js/FivethLab.js";
import FivethPhar from "../../models/LandingPage.js/FivethPhar.js";
import FourthDoctor from "../../models/LandingPage.js/FourthDoctor.js";
import FourthHospital from "../../models/LandingPage.js/FourthHospital.js";
import FourthLab from "../../models/LandingPage.js/FourthLab.js";
import FourthMain from "../../models/LandingPage.js/FourthMain.js";
import FourthPhar from "../../models/LandingPage.js/FourthPhar.js";
import HowItWorkPT from "../../models/LandingPage.js/HowPatientWork.js";
import PatientService from "../../models/LandingPage.js/PatientService.js";
import SecondDoctor from "../../models/LandingPage.js/SecondDoctor.js";
import SecondHospital from "../../models/LandingPage.js/SecondHospital.js";
import SecondLab from "../../models/LandingPage.js/SecondLab.js";
import SecondMain from "../../models/LandingPage.js/SecondMain.js";
import SecondPhar from "../../models/LandingPage.js/SecondPhar.js";
import SevenLab from "../../models/LandingPage.js/SevenLab.js";
import SixLab from "../../models/LandingPage.js/SixLab.js";
import CMSTestimonial from "../../models/LandingPage.js/Testimonial.js";
import ThirdDoctor from "../../models/LandingPage.js/ThirdDoctor.js";
import ThirdHospital from "../../models/LandingPage.js/ThirdHospital.js";
import ThirdLab from "../../models/LandingPage.js/ThirdLab.js";
import ThirdMain from "../../models/LandingPage.js/ThirdMain.js";
import ThirdPhar from "../../models/LandingPage.js/ThirdPhar.js";
import PharmacyCategory from "../../models/PharmacyCategory.js";
import Speciality from "../../models/Speciality.js";
import TestCategory from "../../models/TestCategory.js";
import safeUnlink from "../../utils/globalFunction.js";


export const getLandingPageList = async (req, res) => {
  try {
    const pages = await LandingPage.find()
      .sort({ createdAt: -1 })
      .select("type isActive createdAt");

    res.json({
      success: true,
      data: pages,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load landing pages",
    });
  }
};


export const getLandingPage = async (req, res) => {
  try {
    const page = await LandingPage.findOne({
      type: req.params.type,
    });

    res.json({
      success: true,
      data: page || { type: req.params.type },
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to load landing page",
    });
  }
};



export const saveLandingPage = async (req, res) => {
  try {
    const data = req.body;

    const page = await LandingPage.findOneAndUpdate(
      { type: req.params.type },
      data,
      {
        new: true,
        upsert: true,
      }
    );

    res.json({
      success: true,
      message: "Landing page saved successfully",
      data: page,
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to save landing page",
    });
  }
};
export const saveFirstPharPage = async (req, res) => {
  try {
    let { firstTitle, secondTitle, description, btnLink, opsSnapshot, model } = req.body;

    btnLink = btnLink ? JSON.parse(btnLink) : {};
    opsSnapshot = opsSnapshot ? JSON.parse(opsSnapshot) : {};
    model = model ? JSON.parse(model) : [];

    const existing = await FirstPhar.findOne();

    const uploadedImages = req.files || [];
    let imageIndexes = req.body.imageIndex || [];

    // ensure array
    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // 🔥 Map index → file
    const imageMap = {};
    uploadedImages.forEach((file, i) => {
      const index = imageIndexes[i];
      imageMap[index] = file;
    });

    // ✅ Build updated model safely
    let updatedModel = model.map((item, index) => {
      const newFile = imageMap[index];

      return {
        name: item.name,
        description: item.description,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // ✅ Delete only replaced images
    if (existing && existing.model?.length) {
      existing.model.forEach((oldItem, index) => {
        const newFile = imageMap[index];

        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image); // 🔥 only delete replaced
        }
      });
    }

    const page = await FirstPhar.findOneAndUpdate(
      {},
      {
        firstTitle,
        secondTitle,
        description,
        btnLink,
        opsSnapshot,
        model: updatedModel,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "First Phar page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveSecondPharPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;

    model = model ? JSON.parse(model) : [];

    const existing = await SecondPhar.findOne();

    const uploadedImages = req.files || [];
    let imageIndexes = req.body.imageIndex || [];

    // ensure array
    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // 🔥 Map index → file
    const imageMap = {};
    uploadedImages.forEach((file, i) => {
      const index = imageIndexes[i];
      imageMap[index] = file;
    });

    // ✅ Build updated model safely
    let updatedModel = model.map((item, index) => {
      const newFile = imageMap[index];

      return {
        name: item.name,
        description: item.description,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // ✅ Delete only replaced images
    if (existing && existing.model?.length) {
      existing.model.forEach((oldItem, index) => {
        const newFile = imageMap[index];

        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image); // 🔥 only delete replaced
        }
      });
    }

    const page = await SecondPhar.findOneAndUpdate(
      {},
      {
        title,
        description,
        model: updatedModel,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "First Phar page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveThirdPharPage = async (req, res) => {
  try {
    let { title, model } = req.body;

    model = model ? JSON.parse(model) : [];



    const page = await ThirdPhar.findOneAndUpdate(
      {},
      {
        title,
        model,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Third Phar page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveFourthPharPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;

    model = model ? JSON.parse(model) : [];



    const page = await FourthPhar.findOneAndUpdate(
      {},
      {
        title, description,
        model,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Fourth Phar page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveFivethPharPage = async (req, res) => {
  try {
    let { title, usageRule, model } = req.body;

    model = model ? JSON.parse(model) : [];

    const existing = await FivethPhar.findOne();

    const uploadedImages = req.files || [];
    let imageIndexes = req.body.imageIndex || [];

    // ensure array
    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // 🔥 Map index → file
    const imageMap = {};
    uploadedImages.forEach((file, i) => {
      const index = imageIndexes[i];
      imageMap[index] = file;
    });

    // ✅ Build updated model safely
    let updatedModel = model.map((item, index) => {
      const newFile = imageMap[index];

      return {
        name: item.name,
        description: item.description,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // ✅ Delete only replaced images
    if (existing && existing.model?.length) {
      existing.model.forEach((oldItem, index) => {
        const newFile = imageMap[index];

        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image); // 🔥 only delete replaced
        }
      });
    }

    const page = await FivethPhar.findOneAndUpdate(
      {},
      {
        title, usageRule,
        model: updatedModel,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Fiveth Phar page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getPharmacyLandingPage = async (req, res) => {
  try {
    const firstSection = await FirstPhar.findOne();
    const secondSection = await SecondPhar.findOne();
    const thirdSection = await ThirdPhar.findOne();
    const fourthSection = await FourthPhar.findOne();
    const fivethSection = await FivethPhar.findOne();

    res.json({
      success: true,
      data: { firstSection, secondSection, thirdSection, fourthSection, fivethSection },
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to load landing page",
    });
  }
};
//           Laboratory Landing Page 
export const saveFirstLabPage = async (req, res) => {
  try {
    let { firstTitle, secondTitle, description, topShot, snapShot, bottomShot } = req.body;


    const page = await FirstLab.findOneAndUpdate(
      {},
      {
        firstTitle,
        secondTitle,
        description,
        topShot,
        snapShot,
        bottomShot,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "First Lab page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveSecondLabPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;

    model = model ? JSON.parse(model) : [];

    const existing = await SecondLab.findOne();

    const uploadedImages = req.files || [];
    let imageIndexes = req.body.imageIndex || [];

    // ensure array
    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // 🔥 Map index → file
    const imageMap = {};
    uploadedImages.forEach((file, i) => {
      const index = imageIndexes[i];
      imageMap[index] = file;
    });

    // ✅ Build updated model safely
    let updatedModel = model.map((item, index) => {
      const newFile = imageMap[index];

      return {
        name: item.name,
        description: item.description,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // ✅ Delete only replaced images
    if (existing && existing.model?.length) {
      existing.model.forEach((oldItem, index) => {
        const newFile = imageMap[index];

        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image); // 🔥 only delete replaced
        }
      });
    }

    const page = await SecondLab.findOneAndUpdate(
      {},
      {
        title,
        description,
        model: updatedModel,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Secont Lab page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveThirdLabPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;

    model = model ? JSON.parse(model) : [];

    const existing = await ThirdLab.findOne();

    const uploadedImages = req.files || [];
    let imageIndexes = req.body.imageIndex || [];

    // ensure array
    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // 🔥 Map index → file
    const imageMap = {};
    uploadedImages.forEach((file, i) => {
      const index = imageIndexes[i];
      imageMap[index] = file;
    });

    // ✅ Build updated model safely
    let updatedModel = model.map((item, index) => {
      const newFile = imageMap[index];

      return {
        name: item.name,
        description: item.description,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // ✅ Delete only replaced images
    if (existing && existing.model?.length) {
      existing.model.forEach((oldItem, index) => {
        const newFile = imageMap[index];

        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image); // 🔥 only delete replaced
        }
      });
    }

    const page = await ThirdLab.findOneAndUpdate(
      {},
      {
        title,
        description,
        model: updatedModel,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Secont Lab page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveFourthLabPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;

    model = model ? JSON.parse(model) : [];

    const existing = await FourthLab.findOne();

    const uploadedImages = req.files || [];
    let imageIndexes = req.body.imageIndex || [];

    // ensure array
    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // 🔥 Map index → file
    const imageMap = {};
    uploadedImages.forEach((file, i) => {
      const index = imageIndexes[i];
      imageMap[index] = file;
    });

    // ✅ Build updated model safely
    let updatedModel = model.map((item, index) => {
      const newFile = imageMap[index];

      return {
        name: item.name,
        description: item.description,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // ✅ Delete only replaced images
    if (existing && existing.model?.length) {
      existing.model.forEach((oldItem, index) => {
        const newFile = imageMap[index];

        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image); // 🔥 only delete replaced
        }
      });
    }

    const page = await FourthLab.findOneAndUpdate(
      {},
      {
        title,
        description,
        model: updatedModel,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Secont Lab page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveFivethLabPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;

    model = model ? JSON.parse(model) : [];

    const existing = await FivethLab.findOne();

    const uploadedImages = req.files || [];
    let imageIndexes = req.body.imageIndex || [];

    // ensure array
    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // 🔥 Map index → file
    const imageMap = {};
    uploadedImages.forEach((file, i) => {
      const index = imageIndexes[i];
      imageMap[index] = file;
    });

    // ✅ Build updated model safely
    let updatedModel = model.map((item, index) => {
      const newFile = imageMap[index];

      return {
        name: item.name,
        description: item.description,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // ✅ Delete only replaced images
    if (existing && existing.model?.length) {
      existing.model.forEach((oldItem, index) => {
        const newFile = imageMap[index];

        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image); // 🔥 only delete replaced
        }
      });
    }

    const page = await FivethLab.findOneAndUpdate(
      {},
      {
        title,
        description,
        model: updatedModel,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Fiveth Lab page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveSixLabPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;

    model = model ? JSON.parse(model) : [];

    const existing = await SixLab.findOne();

    const uploadedImages = req.files || [];
    let imageIndexes = req.body.imageIndex || [];

    // ensure array
    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // 🔥 Map index → file
    const imageMap = {};
    uploadedImages.forEach((file, i) => {
      const index = imageIndexes[i];
      imageMap[index] = file;
    });

    // ✅ Build updated model safely
    let updatedModel = model.map((item, index) => {
      const newFile = imageMap[index];

      return {
        name: item.name,
        description: item.description,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // ✅ Delete only replaced images
    if (existing && existing.model?.length) {
      existing.model.forEach((oldItem, index) => {
        const newFile = imageMap[index];

        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image); // 🔥 only delete replaced
        }
      });
    }

    const page = await SixLab.findOneAndUpdate(
      {},
      {
        title,
        description,
        model: updatedModel,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Fiveth Lab page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveSevenLabPage = async (req, res) => {
  try {
    let { title, description, btnLink } = req.body;

    btnLink = btnLink ? JSON.parse(btnLink) : [];



    const page = await SevenLab.findOneAndUpdate(
      {},
      {
        title, description,
        btnLink,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Six lab page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getLabLandingPage = async (req, res) => {
  try {
    const firstSection = await FirstLab.findOne();
    const secondSection = await SecondLab.findOne();
    const thirdSection = await ThirdLab.findOne();
    const fourthSection = await FourthLab.findOne();
    const fivethSection = await FivethLab.findOne();
    const sixSection = await SixLab.findOne();
    const sevenSection = await SevenLab.findOne();

    res.json({
      success: true,
      data: { firstSection, secondSection, thirdSection, fourthSection, fivethSection, sixSection, sevenSection },
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to load landing page",
    });
  }
};

//          Doctor Landing Page 
export const saveFirstDoctorPage = async (req, res) => {
  try {
    let { firstTitle, secondTitle, description, btnLink, appUiShot, topShot, bottomShot, bottomDesc, appUiDesc } = req.body;
    const page = await FirstDoctor.findOneAndUpdate(
      {},
      {
        firstTitle, secondTitle, description, btnLink, appUiShot, topShot, bottomShot, bottomDesc, appUiDesc
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "First Doctor page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveSecondDoctorPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;
    const page = await SecondDoctor.findOneAndUpdate(
      {},
      {
        title, description, model
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Second Doctor page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveThirdDoctorPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;
    const page = await ThirdDoctor.findOneAndUpdate(
      {},
      {
        title, description, model
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Third Doctor page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveFourthDoctorPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;
    const page = await FourthDoctor.findOneAndUpdate(
      {},
      {
        title, description, model
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Fourth Doctor page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveFivethDoctorPage = async (req, res) => {
  try {
    let { title, description, tag, btnLink } = req.body;
    const page = await FivethDoctor.findOneAndUpdate(
      {},
      {
        title, description, tag, btnLink
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Fiveth Doctor page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getDoctorLandingPage = async (req, res) => {
  try {
    const firstSection = await FirstDoctor.findOne();
    const secondSection = await SecondDoctor.findOne();
    const thirdSection = await ThirdDoctor.findOne();
    const fourthSection = await FourthDoctor.findOne();
    const fivethSection = await FivethDoctor.findOne();

    res.json({
      success: true,
      data: { firstSection, secondSection, thirdSection, fourthSection, fivethSection },
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to load landing page",
    });
  }
};
//           Patient Landing Page
export const saveFirstPatientPage = async (req, res) => {
  const heroImage = req.files?.heroImage?.[0];
  const downloadImage = req.files?.downloadImage?.[0];
  const howItWorkImage = req.files?.howItWorkImage?.[0];
  const footerCategory =req.body.category ? JSON.parse(req.body.category) :[]
  try {
    // 🔍 Get existing document
    const existingPage = await FirstPatient.findOne({});

    let updateData = { ...req.body,category:footerCategory };
    // 🖼️ Hero Image
    if (heroImage) {
      if (existingPage?.heroImage) {
        safeUnlink(existingPage.heroImage);
      }
      updateData.heroImage = heroImage.path;
    }

    // 🖼️ Download Image
    if (downloadImage) {
      if (existingPage?.downloadImage) {
        safeUnlink(existingPage.downloadImage);
      }
      updateData.downloadImage = downloadImage.path;
    }

    // 🖼️ How It Work Image
    if (howItWorkImage) {
      if (existingPage?.howItWorkImage) {
        safeUnlink(existingPage.howItWorkImage);
      }
      updateData.howItWorkImage = howItWorkImage.path;
    }

    // 💾 Update / Insert
    const page = await FirstPatient.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "First Patient page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const savePatentTesimonial = async (req, res) => {
  try {
    const file = req.files?.['image']?.[0];
    const { testimonialId, ...rest } = req.body;
    // Extract only file path (important)
    const imagePath = file ? file.path : null;

    // 🔍 Find existing document
    const existingPage = testimonialId
      ? await CMSTestimonial.findById(testimonialId)
      : null;

    if (existingPage) {

      // 🗑️ Delete old image if new one uploaded
      if (imagePath && existingPage.image) {
        safeUnlink(existingPage.image);
      }

      const updatedData = {
        ...rest,
        ...(imagePath && { image: imagePath }), // only update if new image exists
      };

      await CMSTestimonial.findByIdAndUpdate(
        testimonialId,
        updatedData,
        { new: true }
      );

      return res.json({
        success: true,
        message: "Testimonial data was updated successfully",
      });
    }

    // 🆕 Create new document
    await CMSTestimonial.create({
      ...rest,
      image: imagePath,
    });

    return res.json({
      success: true,
      message: "Testimonial data was created successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const deletePatentTesimonial = async (req, res) => {
  const id = req.params.id
  try {
    const data = await CMSTestimonial.findById(id)
    if (!data) return res.status(404).json({ message: "Data not found", success: false })
    safeUnlink(data.image)
    await CMSTestimonial.findByIdAndDelete(id)

    return res.json({
      success: true,
      message: "Testimonial data was deleted successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveHowItWork = async (req, res) => {
  try {
    const file = req.files?.['image']?.[0];
    const { workId, ...rest } = req.body;
    const imagePath = file ? file.path : null;

    const existingPage = workId
      ? await HowItWorkPT.findById(workId)
      : null;

    if (existingPage) {

      // 🗑️ Delete old image if new one uploaded
      if (imagePath && existingPage.image) {
        safeUnlink(existingPage.image);
      }

      const updatedData = {
        ...rest,
        ...(imagePath && { image: imagePath }), // only update if new image exists
      };

      await HowItWorkPT.findByIdAndUpdate(
        workId,
        updatedData,
        { new: true }
      );

      return res.json({
        success: true,
        message: "Work data was updated successfully",
      });
    }

    // 🆕 Create new document
    await HowItWorkPT.create({
      ...rest,
      image: imagePath,
    });

    return res.json({
      success: true,
      message: "Work data was created successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const deleteHowItWorks = async (req, res) => {
  const id = req.params.id
  try {
    const data = await HowItWorkPT.findById(id)
    if (!data) return res.status(404).json({ message: "Data not found", success: false })
    safeUnlink(data.image)
    await HowItWorkPT.findByIdAndDelete(id)

    return res.json({
      success: true,
      message: "How It work data was deleted successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const savePatientService = async (req, res) => {
  try {
    const file = req.files?.['image']?.[0];
    const { serviceId, ...rest } = req.body;
    const imagePath = file ? file.path : null;

    const existingPage = serviceId
      ? await PatientService.findById(serviceId)
      : null;

    if (existingPage) {

      // 🗑️ Delete old image if new one uploaded
      if (imagePath && existingPage.image) {
        safeUnlink(existingPage.image);
      }

      const updatedData = {
        ...rest,
        ...(imagePath && { image: imagePath }), // only update if new image exists
      };

      await PatientService.findByIdAndUpdate(
        serviceId,
        updatedData,
        { new: true }
      );

      return res.json({
        success: true,
        message: "Service data was updated successfully",
      });
    }

    // 🆕 Create new document
    await PatientService.create({
      ...rest,
      image: imagePath,
    });

    return res.json({
      success: true,
      message: "Service data was created successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const deletePatientService = async (req, res) => {
  const id = req.params.id
  try {
    const data = await PatientService.findById(id)
    if (!data) return res.status(404).json({ message: "Data not found", success: false })
    safeUnlink(data.image)
    await PatientService.findByIdAndDelete(id)

    return res.json({
      success: true,
      message: "Service data was deleted successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getPatientLandingPage = async (req, res) => {
  try {
    const firstSection = await FirstPatient.findOne();
    const testCat = await TestCategory.find()
    const speciality = await Speciality.find()
    const testimonial = await CMSTestimonial.find()
    const howItWorks = await HowItWorkPT.find()
    const ptServices = await PatientService.find()
    const ptBanner = await PatientBanner.find()
    const hospitalCat=await HospitalCategory.find()
    const pharmacyCat=await PharmacyCategory.find()

    res.json({
      success: true,
      data: { firstSection, testCat, speciality, testimonial, howItWorks, ptServices, ptBanner,hospitalCat,pharmacyCat },
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to load landing page",
    });
  }
};
export const getPatientFooterCategory = async (req, res) => {
  try {
    const firstSection = await FirstPatient.findOne();

    res.json({
      success: true,
      data:  firstSection
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to load landing page",
    });
  }
};
//          Hospital Landing Page 
export const saveFirstHospitalPage = async (req, res) => {
  try {
    const page = await FirstHospital.findOneAndUpdate(
      {},
      {
        ...req.body
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "First Hospital page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveSecondHospitalPage = async (req, res) => {
  try {
    let {
      title,
      description,
      feature,
      otDashboard,
      patientTimeline,
      neoAiAssist,
    } = req.body;

    // ✅ Parse JSON fields safely
    feature = feature ? JSON.parse(feature) : [];
    otDashboard = otDashboard ? JSON.parse(otDashboard) : [];

    const existing = await SecondHospital.findOne();

    const uploadedImages = req.files || [];
    let imageIndexes = req.body.imageIndex || [];

    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // 🔥 Map index → file
    const imageMap = {};
    uploadedImages.forEach((file, i) => {
      const index = imageIndexes[i];
      imageMap[index] = file;
    });

    // =========================
    // ✅ HANDLE FEATURE IMAGES
    // =========================
    const updatedFeature = feature.map((item, index) => {
      const newFile = imageMap[`feature-${index}`];

      return {
        ...item,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // =========================
    // ✅ HANDLE OT DASHBOARD IMAGES
    // =========================
    const updatedOtDashboard = otDashboard.map((item, index) => {
      const newFile = imageMap[`ot-${index}`];

      return {
        ...item,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // =========================
    // ✅ DELETE REPLACED IMAGES
    // =========================
    if (existing) {
      // feature images
      existing.feature?.forEach((oldItem, index) => {
        const newFile = imageMap[`feature-${index}`];
        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image);
        }
      });

      // otDashboard images
      existing.otDashboard?.forEach((oldItem, index) => {
        const newFile = imageMap[`ot-${index}`];
        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image);
        }
      });
    }

    // =========================
    // ✅ SAVE DATA
    // =========================
    const page = await SecondHospital.findOneAndUpdate(
      {},
      {
        title,
        description,
        feature: updatedFeature,
        otDashboard: updatedOtDashboard,
        patientTimeline,
        neoAiAssist,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Second Hospital page saved successfully",
      data: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveThirdHospitalPage = async (req, res) => {
  try {
    const page = await ThirdHospital.findOneAndUpdate(
      {},
      {
        ...req.body
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Third Hospital page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveFourthHospitalPage = async (req, res) => {
  try {
    const data = await FourthHospital.findOne()
    const security = req?.body?.security ? JSON.parse(req.body.security) : data?.security
    const interoperability = req?.body?.interoperability ? JSON.parse(req.body.interoperability) : data?.interoperability
    const deployment =req?.body?.deployment ? JSON.parse(req.body.deployment) :data?.deployment
    const page = await FourthHospital.findOneAndUpdate(
      {},
      {
        security, interoperability, deployment
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Fourth Hospital page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getHospitalLandingPage = async (req, res) => {
  try {
    const firstSection = await FirstHospital.findOne();
    const secondSection = await SecondHospital.findOne()
    const thirdSection = await ThirdHospital.findOne()
    const fourthSection = await FourthHospital.findOne()

    res.json({
      success: true,
      data: { firstSection, secondSection, thirdSection, fourthSection },
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to load landing page",
    });
  }
};

//            Main Landing Page
export const saveFirstMainPage = async (req, res) => {
  try {

    let {
      title,
      description,
      btnLink,
      appUiShot,
      topShot,
      bottomShot,
      bottomDesc,
      appUiDesc
    } = req.body;

    // ✅ SAFE PARSE ALL JSON FIELDS
    const safeParse = (data) => {
      try {
        return typeof data === "string" ? JSON.parse(data) : data;
      } catch {
        return data;
      }
    };

    btnLink = safeParse(btnLink);
    appUiShot = safeParse(appUiShot);
    topShot = safeParse(topShot);
    bottomShot = safeParse(bottomShot);

    // 🔥 MAIN FIX
    let neoHealthCard = safeParse(req.body.neoHealthCard) || {};

    // 🛑 DOUBLE SAFETY (important)
    if (typeof neoHealthCard !== "object") {
      neoHealthCard = {};
    }

    // ✅ FEATURE IMAGE ATTACH (AFTER PARSE)
    if (Array.isArray(neoHealthCard.feature)) {
      neoHealthCard.feature = neoHealthCard.feature.map((item, i) => {
        const file = req.files?.find(f => f.fieldname === `featureImage_${i}`);

        return {
          ...item,
          image: file ? file.path : item.image || ""
        };
      });
    }

    // ✅ OLD DATA
    const existingPage = await FirstMain.findOne({});

    if (existingPage) {
      if (existingPage.neoHealthCard?.feature?.length) {
        existingPage.neoHealthCard.feature.forEach(item => {
          if (item.image) safeUnlink(item.image);
        });
      }
    }

    const page = await FirstMain.findOneAndUpdate(
      {},
      {
        title,
        description,
        btnLink,
        appUiShot,
        topShot,
        bottomShot,
        bottomDesc,
        appUiDesc,
        neoHealthCard
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Saved successfully",
      data: page,
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveSecondMainPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;

    model = model ? JSON.parse(model) : [];

    const existing = await SecondMain.findOne();

    const uploadedImages = req.files || [];
    let imageIndexes = req.body.imageIndex || [];

    // ensure array
    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // 🔥 Map index → file
    const imageMap = {};
    uploadedImages.forEach((file, i) => {
      const index = imageIndexes[i];
      imageMap[index] = file;
    });

    // ✅ Build updated model safely
    let updatedModel = model.map((item, index) => {
      const newFile = imageMap[index];

      return {
        name: item.name,
        description: item.description,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // ✅ Delete only replaced images
    if (existing && existing.model?.length) {
      existing.model.forEach((oldItem, index) => {
        const newFile = imageMap[index];

        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image); // 🔥 only delete replaced
        }
      });
    }

    const page = await SecondMain.findOneAndUpdate(
      {},
      {
        title,
        description,
        model: updatedModel,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Secont Lab page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveThirdMainPage = async (req, res) => {
  try {
    let { title, description, model } = req.body;

    model = model ? JSON.parse(model) : [];

    const existing = await ThirdMain.findOne();

    const uploadedImages = req.files || [];
    let imageIndexes = req.body.imageIndex || [];

    // ensure array
    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // 🔥 Map index → file
    const imageMap = {};
    uploadedImages.forEach((file, i) => {
      const index = imageIndexes[i];
      imageMap[index] = file;
    });

    // ✅ Build updated model safely
    let updatedModel = model.map((item, index) => {
      const newFile = imageMap[index];

      return {
        name: item.name,
        description: item.description,
        image: newFile
          ? newFile.path.replace(/\\/g, "/")
          : item.image,
      };
    });

    // ✅ Delete only replaced images
    if (existing && existing.model?.length) {
      existing.model.forEach((oldItem, index) => {
        const newFile = imageMap[index];

        if (newFile && oldItem.image) {
          safeUnlink(oldItem.image); // 🔥 only delete replaced
        }
      });
    }

    const page = await ThirdMain.findOneAndUpdate(
      {},
      {
        title,
        description,
        model: updatedModel,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Secont Lab page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const saveFourthMainPage = async (req, res) => {
  try {
    const data = await FourthMain.findOne()
    const compliance = req?.body?.compliance ? JSON.parse(req.body.compliance) : data?.compliance
    const readiness = req?.body?.readiness ? JSON.parse(req.body.readiness) : data?.readiness
    const page = await FourthMain.findOneAndUpdate(
      {},
      {
        compliance, readiness
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Fourth Main page saved successfully",
      data: page,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getMainLandingPage = async (req, res) => {
  try {
    const firstSection = await FirstMain.findOne();
    const secondSection = await SecondMain.findOne()
    const thirdSection = await ThirdMain.findOne()
    const fourthSection = await FourthMain.findOne()

    res.json({
      success: true,
      data: { firstSection, secondSection, thirdSection, fourthSection },
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({
      message: "Failed to load landing page",
    });
  }
};