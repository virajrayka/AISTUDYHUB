// Sends email through Brevo's REST API (needs Node 18+ for built-in fetch)
async function sendEmail({ to, subject, html }) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME || "AI StudyHub",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Brevo error ${response.status}: ${detail}`);
  }
}

module.exports = sendEmail;