import { createClient, AnamEvent } from "@anam-ai/js-sdk";

let anamClient = null;

const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const statusChip = document.getElementById("status-chip");
const statusText = document.getElementById("status-text");
const errorEl = document.getElementById("error");
const videoPlaceholder = document.getElementById("video-placeholder");

// ---------- UI helpers ----------
function setStatus(state, text) {
  // state: "idle" | "connecting" | "live" | "error"
  statusChip.classList.remove("is-live", "is-connecting", "is-error");
  if (state === "live") statusChip.classList.add("is-live");
  if (state === "connecting") statusChip.classList.add("is-connecting");
  if (state === "error") statusChip.classList.add("is-error");
  statusText.textContent = text;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.add("visible");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.remove("visible");
}

function hidePlaceholder() {
  if (videoPlaceholder) videoPlaceholder.classList.add("hidden");
}

function showPlaceholder() {
  if (videoPlaceholder) videoPlaceholder.classList.remove("hidden");
}

// ---------- Start ----------
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  clearError();
  setStatus("connecting", "Connessione in corso…");

  try {
    // Step 1: Get session token from our server
    const response = await fetch("/api/session", { method: "POST" });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Errore dal server");
    }

    const { sessionToken } = await response.json();
    setStatus("connecting", "Token ricevuto, avvio avatar…");
    console.log("Session token received, creating Anam client...");

    // Step 2: Create Anam client and connect
    anamClient = createClient(sessionToken);

    anamClient.addListener(AnamEvent.SESSION_READY, () => {
      console.log("Session ready!");
      setStatus("live", "In diretta — parla pure");
      stopBtn.style.display = "inline-flex";
      hidePlaceholder();
    });

    anamClient.addListener(AnamEvent.SESSION_ENDED, () => {
      console.log("Session ended");
      setStatus("idle", "Sessione terminata");
      startBtn.disabled = false;
      stopBtn.style.display = "none";
      showPlaceholder();
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
    showError("Errore: " + error.message);
    setStatus("error", "Errore di connessione");
    startBtn.disabled = false;
  }
});

// ---------- Stop ----------
stopBtn.addEventListener("click", async () => {
  if (anamClient) {
    await anamClient.stopStreaming();
    anamClient = null;
  }
  setStatus("idle", "Non connesso");
  startBtn.disabled = false;
  stopBtn.style.display = "none";
  showPlaceholder();
});
