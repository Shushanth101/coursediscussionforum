import nodmailer from "nodemailer"
import { configDotenv } from "dotenv";
configDotenv();

const transporter = nodmailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.GOOGLE_APP_PASSWORD
    }
})

export default transporter;