const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // tạo ID duy nhất (unique identifier) theo chuẩn UUID.

// Config transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ================= SEND EMAIL CORE =================
const sendHtmlEmail = async (to, subject, html) => {
  try {
    console.log(`📧 Attempting to send email to: ${to} with subject: ${subject}`);
    
    const logoPath = path.join(__dirname, "../public/assets/images/logo_vuong.png");

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      attachments: [
        {
          filename: 'logo_vuong.png',
          path: logoPath,
          cid: 'logo_vuong' // matches <img src="cid:logo_vuong">
        }
      ]
    });
    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ Email sending FAILED to ${to}:`, error.message);
    throw new Error("Send email failed: " + error.message);
  }
};

// ================= TEMPLATE RENDER =================
const renderTemplate = async (templateName, data) => {
  const filePath = path.join(
    __dirname,
    "../templates/email",
    `${templateName}.ejs`,
  );

  return await ejs.renderFile(filePath, data);
};

// ================= HELPER =================
const appendTrackingId = (html) => {
  return (
    html +
    `<div style="display:none; max-height:0; overflow:hidden;">
      Ref: ${uuidv4()}
    </div>`
  );
};

// ================= EMAIL FUNCTIONS =================
const sendOtpEmail = async (to, otp) => {
  const html = await renderTemplate("otp-email", {
    otp,
    expire: 5,
  });

  await sendHtmlEmail(to, "Mã xác thực của bạn", appendTrackingId(html));
};

// Gửi thông báo ticket mới đến tất cả Moderator
const sendContactNotifyModEmail = async (to, { ticketId, name, email, subject, message, createdAt }) => {
  const dashboardUrl = `${process.env.CLIENT_URL}/moderator`;
  const html = await renderTemplate("contact-notify-mod", {
    ticketId, name, email, subject, message, createdAt, dashboardUrl
  });
  await sendHtmlEmail(to, `[GienPhim] Liên hệ mới từ ${name}: ${subject}`, appendTrackingId(html));
};

// Gửi phản hồi từ Moderator đến người dùng
const sendContactReplyUserEmail = async (to, { name, subject, originalMessage, reply }) => {
  const siteUrl = process.env.CLIENT_URL || "https://gienphim.site";
  const html = await renderTemplate("contact-reply-user", {
    name, subject, originalMessage, reply, siteUrl
  });
  await sendHtmlEmail(to, `[GienPhim] Phản hồi yêu cầu hỗ trợ: ${subject}`, appendTrackingId(html));
};

const sendOrderPaidEmail = async (to, order) => {
  let html = await renderTemplate("order-paid-email", { order });

  const subject = `[GienCar] Xác nhận thanh toán đơn hàng ${order.orderCode}`;

  await sendHtmlEmail(to, subject, appendTrackingId(html));
};

const sendOrderConfirmedEmail = async (to, order) => {
  let html = await renderTemplate("order-confirmed-email", { order });

  const subject = `[GienCar] Đơn hàng ${order.orderCode} đã được xác nhận`;

  await sendHtmlEmail(to, subject, appendTrackingId(html));
};

const sendBookingConfirmedEmail = async (to, booking, carName, carImageUrl) => {
  let html = await renderTemplate("booking-confirmed-email", {
    booking,
    carName,
    carImageUrl,
  });

  const subject = "[GienCar] Lịch lái thử của bạn đã được xác nhận";

  await sendHtmlEmail(to, subject, appendTrackingId(html));
};

const sendBookingFailedEmail = async (
  to,
  booking,
  reason,
  carName,
  carImageUrl,
) => {
  let html = await renderTemplate("booking-failed-email", {
    booking,
    reason,
    carName,
    carImageUrl,
  });

  const subject = "[GienCar] Thông báo về lịch đăng ký lái thử";

  await sendHtmlEmail(to, subject, appendTrackingId(html));
};

module.exports = {
  sendOtpEmail,
  sendOrderPaidEmail,
  sendOrderConfirmedEmail,
  sendBookingConfirmedEmail,
  sendBookingFailedEmail,
  sendContactNotifyModEmail,
  sendContactReplyUserEmail,
};
