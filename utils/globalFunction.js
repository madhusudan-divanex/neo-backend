import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Inventory from '../models/Pharmacy/inventory.model.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import axios from 'axios';
import nodemailer from 'nodemailer';
import User from '../models/Hospital/User.js';
dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const safeUnlink = (filePath) => {
  try {
    // Convert relative path to absolute
    const absolutePath = path.join(__dirname, '..', filePath);


    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log('File deleted successfully');
    } else {
      console.warn('File not found:', absolutePath);
    }
  } catch (err) {
    console.error('Error deleting file:', filePath, err);
  }
};
const updateInventoryStock = async (products, type = "decrease") => {
  for (let item of products) {
    const inventory = await Inventory.findById(item.inventoryId);
    if (type === "decrease") {
      inventory.quantity -= Number(item.quantity);
      inventory.sellCount += Number(item.quantity);
    } else {
      inventory.quantity += Number(item.quantity);
      inventory.sellCount -= Number(item.quantity);

    }
    await inventory.save();
  }
};
const checkStockAvailability = async (userId, products) => {
  for (let item of products) {
    const inventory = await Inventory.findOne({
      _id: item.inventoryId, $or: [
        { pharId: userId },
        { hospitalId: userId }
      ]
    });
    if (!inventory) {
      return { success: false, message: "Inventory not found" };
    }
    if (inventory.quantity < item.quantity) {
      return {
        success: false,
        message: `Insufficient stock for ${inventory._id}`
      };
    }
  }
  return { success: true };
};
const capitalizeFirst = (str = "") =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fetchFromGemini = async (
  question,
  filePath,
  fileMime,
  audioPath,
  audioMime
) => {
  const parts = [];

  parts.push({ text: question });

  // ---------- FILE ----------
  if (filePath && fileMime) {
    const base64File = fileToBase64(filePath);

    parts.push({
      inlineData: {
        mimeType: fileMime, // ✅ real mimetype from multer
        data: base64File,
      },
    });
  }

  // ---------- AUDIO ----------
  if (audioPath && audioMime) {
    const base64Audio = fileToBase64(audioPath);

    parts.push({
      inlineData: {
        mimeType: audioMime, // ✅ real mimetype from multer
        data: base64Audio,
      },
    });
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts }],
      }),
    }
  );

  const data = await response.json();

  if (data.error) {
    console.log("Gemini Error:", data.error);
    throw new Error(data.error.message);
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response text returned from Gemini");
  }

  return text;
};


const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  console.log("Audio Path:", filePath);
  console.log("Detected Extension:", ext);
  switch (ext) {
    // ---------- PDF ----------
    case ".pdf":
      return "application/pdf";

    // ---------- Images ----------
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";

    // ---------- Audio ----------
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".m4a":
      return "audio/mp4";
    case ".webm":
      return "audio/webm";
    case ".mp4": // sometimes audio saved as mp4 container
      return "audio/mp4";

    default:
      return null;
  }
};



const parseGeminiJSON = (text) => {
  // Remove ```json and ``` fences
  const cleaned = text
    .replace(/```json/i, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
};
const askQuestionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ⏱ 15 minutes
  max: 10, // ❗ 10 questions per 15 min per user/IP
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many questions. Please try again after some time.",
  },

  keyGenerator: (req) => {
    // ✅ user-based limit (better than IP for auth APIs)
    return req.user?.userId;
  },
});
const buildPrompt = (question, medicalHistory, userName = "userName") => `
You are a medical health knowledge generator for a doctor–patient app.
 
Rules:
- Target audience: patient
- Language: simple, non-technical
- No diagnosis, no medicine dosage
- Educational content only
- Personalize the explanation considering the patient's medical history
- Address the patient by name using "${userName}"
- Emergency red flags must be included if relevant
- Generate EXACTLY 3 follow-up questions
- Follow-up questions must:
  - Be highly personalized based on BOTH the patient's question AND their medical history
  - Refer directly to the patient's known conditions when relevant
  - Focus on practical behaviors, symptoms, risks, or challenges specific to the patient
  - Be written in simple patient language
  - Include the placeholder "${userName}" naturally in EACH question
  - Be direct and specific (no vague or broad questions)

Content limits:
- "commonCauses": maximum 70 words
- "seriousCauses": maximum 70 words
- "whenToSeekHelp": maximum 70 words
- "generalNextSteps": maximum 70 words
- "medicalBoundaryNote": maximum 50 words
- Each follow-up question: maximum 15 words

Out-of-context handling:
- If the patient question is NOT related to health or medicine:
  - Set "defination" to "Out of context question"
  - Set "medicalBoundaryNote" to "This question is not related to health or medical topics."
  - Set "generalNextSteps" to an empty array
  - Set "whenToSeekHelp" to an empty array
  - Set "seriousCauses" to an empty array
  - Set "commonCauses" to an empty array
  - Generate 3 follow-up questions that gently guide the patient toward health topics

- Output MUST be valid JSON ONLY
- Follow EXACT structure below
- Do NOT add extra keys
- Do NOT add markdown, code blocks, or explanations
- If medical history is missing or empty, give general guidance only
 
Patient details:
- Name: ${userName}
- Medical history (for context only, not diagnosis):
${medicalHistory}
 
JSON FORMAT:
 
{
  "defination": "",
  "generalNextSteps": [],
 
  "whenToSeekHelp": [],
  "seriousCauses": [],
  "commonCauses": [],
 
  "followUpQuestions": [
    "",
    "",
    ""
  ],
 
  "medicalBoundaryNote":"",
  "followUpQuestions": []
}
 
Patient question:
"${question}"
`;


const doctorPrompt = (question) => `
You are a medical health knowledge generator for a doctor–patient app.

Rules:
- Target audience: doctor
- Language: simple, non-technical
- No diagnosis, no medicine dosage
- Educational content only
- Emergency red flags must be included
- Output MUST be valid JSON ONLY
- Follow EXACT structure below
- Do NOT add extra keys
- Do NOT add markdown or explanations
- Generate 3 follow-up questions that gently guide the doctor toward health topics

JSON FORMAT:

{
  "clinicalSummary": "",
  "specialistReferral": "",
  "redFlags": [],
  "possibleTreatmentClasses": [],
  "answer_detailed": "",
  "recommendedInvestigations": [],
  "followUpQuestions": []
}

Doctor question:
"${question}"
`;


const buildFollowUpPrompt = (question, audience) => `

You are NeoAi, a medical assistant inside a doctor–patient app.
 
Goal:

Provide:

1) A short, simple explanation of the topic (maximum 60 words).

2) Exactly 3 simple follow-up questions related to the topic that help the user choose what they want to explore next.
 
Rules:

- Target audience: ${audience}

- Language: very simple and easy to understand

- No diagnosis

- No treatment advice

- No medicine dosage

- Keep explanation under 60 words

- Follow-up questions must be general and informational

- Do NOT ask emergency-related questions

- Do NOT add explanations

- Output MUST be valid JSON ONLY

- Use only these keys: "summary" and "followUpQuestions"

- "followUpQuestions" must be an array with exactly 3 questions
 
User question:

"${question}"

`;

async function sendMobileOtp(phone, code) {
  let contactNumber = "91" + phone
  const url = "https://control.msg91.com/api/v5/flow";

  const payload = {
    template_id: "69848aa27f633e71e228e1f8",
    short_url: "0",
    recipients: [
      {
        mobiles: contactNumber,   // example: 919699696969
        var: code         // example: 123456
      }
    ]
  };

  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    authkey: "490210ApoDXuuw869848ef9P1"
  };

  try {
    const response = await axios.post(url, payload, { headers });

    return response.data;
  } catch (error) {
    console.error("SMS Error:", error.response?.data || error.message);
    throw error;
  }
}
async function sendEmailOtp(email, code) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    },
    tls: {
      rejectUnauthorized: false,
    }
  });
  const html = `
  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
    <h2 style="color: #2c3e50;">NeoHealthCard Verification</h2>
    <p>Your One-Time Password (OTP) is:</p>
    <h1 style="letter-spacing: 5px; color: #27ae60;">${code}</h1>
    <p>This code will expire in 10 minutes.</p>
  </div>
`;


  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "NeoHealthCard Otp",
    html,

  });
}
function generateOTP() {
  return Math.floor(100000 + Math.random() * 9000).toString();
}
const fileToBase64 = (filePath) => {
  if (!filePath) return null;

  const stats = fs.statSync(filePath);

  if (stats.size === 0) {
    throw new Error("Uploaded file is empty");
  }

  const fileBuffer = fs.readFileSync(filePath);
  return fileBuffer.toString("base64");
};
const pharmacyFollowUpPrompt = (question) => `

You are NeoAi, a clinical pharmacy assistant inside a pharmacist professional panel.

Goal:

Provide:

1) A concise, clinically accurate explanation of the medication-related topic (maximum 80 words).

2) Exactly 3 professional follow-up questions that help clarify what aspect of the medication topic the pharmacist wants to explore further.

Rules:

- Target audience: pharmacy

- Use professional clinical language appropriate for pharmacists

- Focus strictly on pharmacology, mechanism of action, pharmacokinetics, pharmacodynamics, indications, contraindications, interactions, adverse effects, stability, storage, and guideline-based use

- No medical diagnosis

- No prescribing decisions for specific patients

- No individualized therapy adjustments

- No specific dosage calculations for patient cases

- No emergency or acute management instructions

- Keep explanation under 80 words

- Follow-up questions must be professional, general, and topic-expanding (not patient-specific)

- Do NOT add explanations outside the requested structure

- Output MUST be valid JSON ONLY

- Use only these keys: "summary" and "followUpQuestions"

- "followUpQuestions" must be an array with exactly 3 questions

User question:

"${question}"

`;
const labFollowUpPrompt = (question) => `

You are NeoAi, a clinical laboratory assistant inside a laboratory professional panel.

Goal:

Provide:

1) A concise, technically accurate explanation of the laboratory-related topic (maximum 80 words).

2) Exactly 3 professional follow-up questions that help clarify which laboratory aspect the user wants to explore further.

Rules:

- Target audience: laboratory

- Use professional laboratory and diagnostic terminology

- Focus strictly on laboratory science (test principles, methodology, specimen requirements, reference ranges, sensitivity/specificity, interpretation frameworks, pre-analytical/analytical/post-analytical factors, quality control)

- No medical diagnosis

- No clinical treatment recommendations

- No patient-specific interpretation

- No emergency or critical value management instructions

- Keep explanation under 80 words

- Follow-up questions must be professional, general, and topic-expanding (not patient-specific)

- Do NOT add explanations outside the requested structure

- Output MUST be valid JSON ONLY

- Use only these keys: "summary" and "followUpQuestions"

- "followUpQuestions" must be an array with exactly 3 questions

User question:

"${question}"

`;


export const sendWelcomeEmail = async (userId) => {
  try {
    // 1. Get User
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const { name, email, role } = user;

    // 2. Dynamic Login URL
    const roleUrlMap = {
      patient: process.env.PATIENT_URL,
      doctor: process.env.DOCTOR_URL,
      hospital: process.env.HOSPITAL_URL,
      pharmacy: process.env.PHARMACY_URL,
      laboratory: process.env.LABORATORY_URL,
    };

    const loginUrl = roleUrlMap[role] || process.env.FRONTEND_URL;

    // 3. Read HTML Template File
    const templatePath = path.join(process.cwd(), "utils", "emailTemplate.html");
    let html = fs.readFileSync(templatePath, "utf-8");

    // 4. Replace Dynamic Values
    html = html
      .replace(/{{userName}}/g, name || "User")
      .replace(/{{email}}/g, email)
      .replace(/{{role}}/g, role)
      .replace(/{{loginUrl}}/g, loginUrl)

    // 5. Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // ✅ FIX
      },
    });

    // 6. Send Email
    await transporter.sendMail({
      from: `"NeoHealthCard" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Welcome to NeoHealthCard 🎉",
      html,
    });

    console.log("✅ Welcome email sent");

  } catch (error) {
    console.error("❌ Email error:", error.message);
  }
};
export const validateUsers = async (patientId, doctorId, hospitalId) => {
  const patient = await User.findById(patientId);
  if (!patient) throw new Error("Patient not found");

  const doctor = await User.findById(doctorId);
  if (!doctor) throw new Error("Doctor not found");

  if (hospitalId) {
    const hospital = await User.findById(hospitalId);
    if (!hospital) throw new Error("Hospital not found");
  }
};
export {
  updateInventoryStock, checkStockAvailability, capitalizeFirst, fetchFromGemini, doctorPrompt, fileToBase64, labFollowUpPrompt,
  buildPrompt, askQuestionRateLimiter, sendEmailOtp, sendMobileOtp, generateOTP, buildFollowUpPrompt, parseGeminiJSON, pharmacyFollowUpPrompt
};
export default safeUnlink;
