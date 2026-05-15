import SocialLinks from "../models/Admin/socialLinks.model.js";
import User from "../models/Hospital/User.js";
import renderTemplate from "./emailTemplateEngine.js";
import nodemailer from 'nodemailer';

const generateTemplate = async (
    templatePath,
    dynamicData = {}
) => {

    const siteData = await SocialLinks.findOne();
    const commonData = {
        address: siteData?.address || "",
        email: siteData?.email || "",
        phone: siteData?.contactNumber || "",
        website: siteData?.website || "",
        facebook: siteData?.facebook || "",
        twitter: siteData?.twitter || "",
        instagram: siteData?.instagram || "",
        youtube: siteData?.youtube || "",
    };

    return renderTemplate(templatePath, {
        ...commonData,
        ...dynamicData,
    });
};

const test = async () => {

    const html = await generateTemplate(
        "Email Template/patient/welcome.html",
        {
            name: "John Doe",
            email: "[EMAIL_ADDRESS]",
            password: "[PASSWORD]",
            id: "1",
        }
    );

    // console.log("HTML =>", html);
};

test();
const sendPatientEmail = async (path, data, subject, userId) => {
    const html = await generateTemplate(path, data,);
    let user = await User.findById(userId);
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

    await transporter.sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: subject,
        html
    });
};
const sendDoctorEmail = async (path, data, subject, userId) => {
    const html = await generateTemplate(path, data,);
    let user = await User.findById(userId);
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

    await transporter.sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: subject,
        html
    });
};

// sendPatientEmail(
//     "Email Template/doctor/Welcome.html",
//     {
//         name: "John Doe",
//         password: "[PASSWORD]",
//         id: "1",
//     },
//     "Welcome to NeoHealthCard",
//     "69eb58b7f76821d368f38042"
// );
export default sendPatientEmail;
export { sendDoctorEmail }