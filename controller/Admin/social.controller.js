import SocialLinks from "../../models/Admin/socialLinks.model.js";

export const getSocialLinks = async (req, res) => {
  try {
    const links = await SocialLinks.findOne();

    res.json({
      success: true,
      data: links || {}
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


export const saveSocialLinks = async (req, res) => {
  try {
    const { facebook, instagram, youtube, twitter, linkedin ,email,contactNumber,address} = req.body;

    const links = await SocialLinks.findOneAndUpdate(
      {},
      { facebook, instagram, youtube, twitter, linkedin,email,contactNumber,address },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Social links saved",
      data: links
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


