// utils/emailTemplateEngine.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Replace dynamic variables in HTML template
 * Example:
 * {{name}}
 * {{doctorName}}
 * {{appointmentDate}}
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const renderTemplate = (templatePath, data = {}) => {
    try {
        // Read HTML File
        let html = fs.readFileSync(
            path.join(__dirname, "..", templatePath),
            "utf8"
        );

        // Replace Variables
        Object.keys(data).forEach((key) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
            html = html.replace(regex, data[key] ?? "");
        });
        return html;
    } catch (error) {
        console.log("Template Render Error:", error);
        throw error;
    }
};

export default renderTemplate;