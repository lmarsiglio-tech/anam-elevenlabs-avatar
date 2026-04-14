export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Step 1: Get signed URL from ElevenLabs
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${process.env.ELEVENLABS_AGENT_ID}`,
      {
        method: "GET",
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
      }
    );

    if (!elevenLabsResponse.ok) {
      const errText = await elevenLabsResponse.text();
      console.error("ElevenLabs error:", elevenLabsResponse.status, errText);
      return res.status(500).json({ error: "Failed to get ElevenLabs signed URL" });
    }

    const { signed_url } = await elevenLabsResponse.json();
    console.log("Got ElevenLabs signed URL");

    // Step 2: Create Anam session token with ElevenLabs settings
    const anamResponse = await fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ANAM_API_KEY}`,
      },
      body: JSON.stringify({
        personaConfig: {
          avatarId: process.env.ANAM_AVATAR_ID,
        },
        elevenLabsAgentSettings: {
          signedUrl: signed_url,
        },
      }),
    });

    if (!anamResponse.ok) {
      const errText = await anamResponse.text();
      console.error("Anam error:", anamResponse.status, errText);
      return res.status(500).json({ error: "Failed to create Anam session: " + errText });
    }

    const { sessionToken } = await anamResponse.json();
    console.log("Got Anam session token");

    return res.status(200).json({ sessionToken });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error: " + error.message });
  }
}
