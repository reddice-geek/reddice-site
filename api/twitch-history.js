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
    const accessToken = tokenData.access_token;

    const userResponse = await fetch(
      `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,
      {
        headers: {
          "Client-ID": clientId,
          "Authorization": `Bearer ${accessToken}`
        }
      }
    );

    if (!userResponse.ok) {
      throw new Error("Unable to fetch Twitch user");
    }

    const userData = await userResponse.json();
    const user = Array.isArray(userData.data) ? userData.data[0] : null;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const videosResponse = await fetch(
      `https://api.twitch.tv/helix/videos?user_id=${encodeURIComponent(user.id)}&type=archive&first=12`,
      {
        headers: {
          "Client-ID": clientId,
          "Authorization": `Bearer ${accessToken}`
        }
      }
    );

    if (!videosResponse.ok) {
      throw new Error("Unable to fetch Twitch videos");
    }

    const videosData = await videosResponse.json();
    const items = Array.isArray(videosData.data) ? videosData.data : [];

    return res.status(200).json({
      items: items.map((video) => ({
        id: video.id,
        title: video.title || "Stream",
        description: video.description || "",
        created_at: video.created_at,
        published_at: video.published_at,
        url: video.url,
        thumbnail_url: (video.thumbnail_url || "")
          .replace(/%\{width\}/g, "640")
          .replace(/%\{height\}/g, "360"),
        duration: video.duration,
        view_count: video.view_count || 0
      }))
    });
  } catch (error) {
    return res.status(500).json({
      error: "Twitch history failed"
    });
  }
}
