async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function clean(value, max = 1000) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await readBody(req);

    const name = clean(body.name, 120);
    const email = clean(body.email, 180);
    const subject = clean(body.subject, 180);
    const message = clean(body.message, 4000);
    const website = clean(body.website, 200);

    if (website) {
      return res.status(200).json({ ok: true });
    }

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Tous les champs sont obligatoires." });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

    if (!resendApiKey || !toEmail) {
      return res.status(500).json({ error: "Configuration mail manquante." });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2>Nouveau message depuis le site Reddice HUB</h2>
        <p><strong>Nom / pseudo :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Sujet :</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br>")}</p>
      </div>
    `;

    const text = [
      "Nouveau message depuis le site Reddice HUB",
      `Nom / pseudo : ${name}`,
      `Email : ${email}`,
      `Sujet : ${subject}`,
      "",
      message
    ].join("\n");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `[Reddice HUB] ${subject}`,
        html,
        text
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text().catch(() => "");
      return res.status(500).json({ error: `Envoi mail impossible. ${errorText}` });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur pendant l’envoi du message." });
  }
}
