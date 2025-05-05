const { MailtrapClient } = require("mailtrap");

function createMailtrapSDK({ token, inboxId, senderEmail, senderName = "Your App" }) {
  const client = new MailtrapClient({
    token,
  });

  async function sendVerificationEmail(toEmail, verificationCode) {
    const sender = {
      email: senderEmail,
      name: senderName,
    };

    const recipients = [{ email: toEmail }];

    return client.testing.send({
      from: sender,
      to: recipients,
      subject: "Your Verification Code",
      text: `Your verification code is: ${verificationCode}`,
      html: `<h2>Your verification code is: ${verificationCode}</h2>`,
      category: "Signup Verification",
    });
  }

  return {
    sendVerificationEmail,
  };
}

module.exports = createMailtrapSDK;
