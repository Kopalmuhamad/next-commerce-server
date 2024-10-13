import nodemailer from "nodemailer";
import mailerConfig from "./mailerConfig.js";

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport(mailerConfig);

  await transporter.sendMail({
    from: '"Your Boss 👻" admin@mail.com', // sender address
    to, // list of receivers
    subject, // Subject line
    html, // html body
  });
};
