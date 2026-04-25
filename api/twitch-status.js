export default async function handler(req, res) {
  try {
    const login = req.query.login || "reddice_stream";
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Missing Twitch env vars" });
    }

    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials"
      })
    });

    if (!tokenResponse.ok) {
      throw new Error("Unable to get Twitch token");
    }

    const tokenData = await tokenResponse.json();

    const streamResponse = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(login)}`,
      {
        headers: {
          "Client-ID": clientId,
          "Authorization": `Bearer ${tokenData.access_token}`
        }
      }
    );

    if (!streamResponse.ok) {
      throw new Error("Unable to fetch Twitch stream");
    }

    const streamData = await streamResponse.json();
    const stream = Array.isArray(streamData.data) ? streamData.data[0] : null;

    return res.status(200).json({
      live: Boolean(stream),
      title: stream?.title || null,
      game_name: stream?.game_name || null,
      viewer_count: stream?.viewer_count || 0,
      started_at: stream?.started_at || null
    });
  } catch (error) {
    return res.status(500).json({
      error: "Twitch status failed"
    });
  }
}