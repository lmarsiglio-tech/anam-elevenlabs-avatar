import { createClient, AnamEvent } from "@anam-ai/js-sdk";

let anamClient = null;

const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const status = document.getElementById("status");
const errorEl = document.getElementById("error");

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  errorEl.textContent = "";
  status.textContent = "Connessione in corso...";

  try {
    // Step 1: Get session token from our server
    const response = await fetch("/api/session", { method: "POST" });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Errore dal server");
    }

    const { sessionToken } = await response.json();
    status.textContent = "Token ricevuto, avvio avatar...";
    console.log("Session token received, creating Anam client...");

    // Step 2: Create Anam client and connect
    anamClient = createClient(sessionToken);

    anamClient.addListener(AnamEvent.SESSION_READY, () => {
      console.log("Session ready!");
      status.textContent = "🟢 Connesso — parla!";
      stopBtn.style.display = "inline-block";
    });

    anamClient.addListener(AnamEvent.SESSION_ENDED, () => {
      console.log("Session ended");
      status.textContent = "Sessione terminata";
      startBtn.disabled = false;
      stopBtn.style.display = "none";
    });

    anamClient.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, (messages) => {
      console.log("Conversazione:", messages);
    });

    anamClient.addListener(AnamEvent.CONNECTION_ESTABLISHED, () => {
      console.log("WebRTC connection established");
    });

    // Connect avatar video to the <video> element
    console.log("Calling streamToVideoElement...");
    await anamClient.streamToVideoElement("avatar-video");
    console.log("streamToVideoElement completed");
  } catch (error) {
    console.error("Errore:", error);
    errorEl.textContent = "Errore: " + error.message;
    status.textContent = "Disconnesso";
    startBtn.disabled = false;
  }
});

stopBtn.addEventListener("click", async () => {
  if (anamClient) {
    await anamClient.stopStreaming();
    anamClient = null;
  }
  status.textContent = "Disconnesso";
  startBtn.disabled = false;
  stopBtn.style.display = "none";
});
