
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

console.log("Email:", process.env.EMAIL_USER);
console.log("Password loaded:", Boolean(process.env.EMAIL_PASS));

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

try {
  await transporter.verify();
  console.log("Gmail SMTP authentication successful!");
} catch (error) {
  console.error("SMTP Error:", error.message);
}
