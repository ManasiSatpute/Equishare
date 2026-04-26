import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL || 'dummy@example.com', // To use real emails, provide these in .env
      pass: process.env.SMTP_PASSWORD || 'dummy-password', 
    },
  });

  // Define the email options
  const mailOptions = {
    from: `EquiShare <${process.env.SMTP_EMAIL || 'dummy@example.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    if(!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.log("================ Email Mock Dispatch ================");
        console.log("To: ", options.email);
        console.log("Subject: ", options.subject);
        console.log("Content: ", options.html);
        console.log("=====================================================");
        return; // Skip actual sending if no credentials
    }
    // Actually send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export default sendEmail;
