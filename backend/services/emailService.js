import transporter from "../config/emailTransporter.js"
import { configDotenv } from "dotenv";
configDotenv();

export const sendMail = async (to, body) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            html: body
        })
        return info;

    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}