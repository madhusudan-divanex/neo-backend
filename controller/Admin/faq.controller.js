import Faq from "../../models/Admin/Faq.js";

/* ================= CREATE FAQ ================= */
export const createFaq = async (req, res) => {
  try {
    const { question, answer,panel } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: "Question & Answer required" });
    }

    const faq = await Faq.create({
      question,
      answer,panel,
      createdBy: req.admin.id   // from adminAuth middleware
    });

    res.status(201).json({
      message: "FAQ added successfully",
      data: faq
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET ALL FAQ ================= */
export const getFaqs = async (req, res) => {
  const {panel}=req.query
  try {
    let filter={};
    if(panel){
      filter.panel=panel
    }
    const faqs = await Faq.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: faqs
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET SINGLE FAQ ================= */
export const getFaqById = async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res.json({ data: faq });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE FAQ ================= */
export const updateFaq = async (req, res) => {
  try {
    const { question, answer, status,panel } = req.body;

    const faq = await Faq.findByIdAndUpdate(
      req.params.id,
      { question, answer, status,panel },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res.json({
      message: "FAQ updated successfully",
      data: faq
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE FAQ ================= */
export const deleteFaq = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res.json({ message: "FAQ deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
