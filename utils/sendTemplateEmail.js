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

const sendPatientEmail = async (path, data, subject, userId) => {
    try {


        const html = await generateTemplate(path, data);
        let user = await User.findById(userId);
        if (!user || !user.email) {
            console.log("User or email not found");
            return;
        }
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
    } catch (error) {
        console.log(error);
    }
};
const sendDoctorEmail = async (path, data, subject, userId) => {
    try {


        const html = await generateTemplate(path, data);
        let user = await User.findById(userId);
        if (!user || !user.email) {
            console.log("User or email not found");
            return;
        }
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
    } catch (error) {
        console.log(error);
    }
};
const sendLabEmail = async (path, data, subject, userId) => {
    try {


        const html = await generateTemplate(path, data);
        let user = await User.findById(userId);
        if (!user || !user.email) {
            console.log("User or email not found");
            return;
        }
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
    } catch (error) {
        console.log(error);
    }
};
const sendPharEmail = async (path, data, subject, userId) => {
    try {

        const html = await generateTemplate(path, data);
        let user = await User.findById(userId);
        if (!user || !user.email) {
            console.log("User or email not found");
            return;
        }
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
    } catch (error) {
        console.log(error);
    }
};
const sendHospitalEmail = async (path, data, subject, userId) => {
    try {

        const html = await generateTemplate(path, data);
        let user = await User.findById(userId);
        if (!user || !user.email) {
            console.log("User or email not found");
            return;
        }
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
    } catch (error) {
        console.log(error);
    }
};

export default sendPatientEmail;
export { sendDoctorEmail, sendLabEmail, sendPharEmail, sendHospitalEmail }