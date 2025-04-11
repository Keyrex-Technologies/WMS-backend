import nodemailer from "nodemailer";


let transporter = nodemailer.createTransport({
    service: "gmail", // You can use any SMTP service like Outlook, Yahoo, etc.
    auth: {
        user: process.env.EMAIL_EMAIL, // Your email
        pass: process.env.EMAIL_PASS, // App password (Not your normal password)
    },
});
export async function sendEmail(email, otp, name) {
    console.log(email, otp, name)
    console.log("process.env.EMAIL_EMAIL", process.env.EMAIL_EMAIL)
    console.log("process.env.EMAIL_PASS", process.env.EMAIL_PASS)
    try {


        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender email
            to: email, // Receiver email
            subject: "Your OTP for Verification",
            html: `<p>Hi <strong>${name}</strong>,</p>
             <p>Your OTP for email verification is: <strong>${otp}</strong></p>
             <p>This OTP is valid for 15 minutes.</p>
             <p>If you did not request this, please ignore this email.</p>
             <p>Best regards,</p>
             <p>Your Company Name</p>`,
        };

        // Send email
        await transporter.sendMail(mailOptions);

        console.log("OTP Email sent successfully to", email);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}


export async function sendPasswordResetEmail(email, otp, name) {
    try {


        const mailOptions = {
            from: `"Your App Name" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Password Reset Request",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #333;">Hi ${name},</h2>
          <p>We received a request to reset your password.</p>
          <p>Your verification code is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; font-size: 24px;">
            <strong>${otp}</strong>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>Best regards,<br/>Your App Team</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log("Password reset email sent to", email);
        return true;
    } catch (error) {
        console.error("Error sending password reset email:", error);
        return false;
    }
}

export const sendAdminAddedEmployeeEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: `"Your Company" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};

// export { sendEmail, sendPasswordResetEmail };