export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const elRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${process.env.ELEVENLABS_AGENT_ID}`,
      {
        method: "GET",
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
      }
    );

    if (!elRes.ok) {
      const errText = await elRes.text();
      console.error("ElevenLabs error:", elRes.status, errText);
      return res.status(500).json({ error: "ElevenLabs error: " + errText });
    }

    const { signed_url } = await elRes.json();
    console.log("Got ElevenLabs signed URL");

    const anamRes = await fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ANAM_API_KEY}`,
      },
      body: JSON.stringify({
        personaConfig: {
          avatarId: process.env.ANAM_AVATAR_ID,
        },
        environment: {
          elevenLabsAgentSettings: {
            signedUrl: signed_url,
            agentId: process.env.ELEVENLABS_AGENT_ID,
          },
        },
      }),
    });

    if (!anamRes.ok) {
      const errText = await anamRes.text();
      console.error("Anam error:", anamRes.status, errText);
      return res.status(500).json({ error: "Anam error: " + errText });
    }

    const { sessionToken } = await anamRes.json();
    console.log("Got Anam session token");

    return res.status(200).json({ sessionToken });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: error.message });
  }
}
