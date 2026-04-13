import CMS from "../../models/Admin/cms.model.js";

export const getCMSPageList = async (req, res) => {
  const { panel } = req.query;
  try {
    const filter = {};
    if(panel){
      filter.panel = panel
    }
    const pages = await CMS.find(filter).sort({ createdAt: 1 });
    res.json({ success: true, data: pages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load CMS pages" });
  }
};

export const getCMSPage = async (req, res) => {
  try {
    const page = await CMS.findOne({
      slug: req.params.slug,
      $or: [
        { panel: req.params.panel || 'website' },
        { panel: { $exists: false } } // old records
      ]
    });
    res.json({
      success: true,
      data: page || { title: "", slug: req.params.slug, content: "", status: "active" }
    });
  } catch {
    res.status(500).json({ message: "Failed to load page" });
  }
};

export const saveCMSPage = async (req, res) => {
  try {
    const { title, content, status, panel } = req.body;
    const page = await CMS.findOneAndUpdate(
      { slug: req.params.slug, panel: panel },
      { title, content, panel, status: status || "active" },
      { new: true, upsert: true }
    );
    res.json({ success: true, message: "Page saved successfully", data: page });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to save page" });
  }
};

export const deleteCMSPage = async (req, res) => {
  try {
    await CMS.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Page deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};
