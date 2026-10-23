let currentMode = "currency";
let selectedLang = "Hindi";
let latestSpeechText = "";

const video = document.getElementById("webcam");
const canvas = document.getElementById("snapshot");
const scanBtn = document.getElementById("scan-btn");
const outputText = document.getElementById("output-text");
const replayBtn = document.getElementById("replay-btn");
const modeButtons = document.querySelectorAll(".mode-btn");
const langRadios = document.querySelectorAll('input[name="lang"]');

// 1. Webcam Start Karna
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    video.srcObject = stream;
    document.getElementById("camera-loading").style.display = "none";
  } catch (err) {
    console.error("Camera access error:", err);
    document.getElementById("camera-loading").innerText = "⚠️ Camera permission allow karein!";
  }
}
startCamera();

// 2. Mode Selector Logic (Currency / Medicine / Food / Scene)
modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    modeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.getAttribute("data-mode");
  });
});

// 3. Language Selector Logic (Hindi / English)
langRadios.forEach(radio => {
  radio.addEventListener("change", (e) => {
    selectedLang = e.target.value;
  });
});

// 4. Text-To-Speech (Aawaz Bolne Ka Function)
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = selectedLang === "Hindi" ? "hi-IN" : "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

// 5. Scan & Analyze Button Click
scanBtn.addEventListener("click", async () => {
  // Snapshot capture karein
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const base64Image = canvas.toDataURL("image/jpeg", 0.8);

  scanBtn.disabled = true;
  scanBtn.innerText = "⏳ Netra dekh raha hai...";
  outputText.innerText = "Gemma 4 analyze kar raha hai, kripya intezar karein...";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: base64Image,
        mode: currentMode,
        language: selectedLang
      })
    });

    const data = await response.json();

    if (data.success) {
      latestSpeechText = data.text;
      outputText.innerText = data.text;
      replayBtn.style.display = "inline-block";
      
      // Automatic Bol kar sunao
      speak(data.text);
    } else {
      outputText.innerText = "Kuch galti hui: " + data.message;
    }
  } catch (err) {
    console.error(err);
    outputText.innerText = "Server se connect nahi ho paya.";
  } finally {
    scanBtn.disabled = false;
    scanBtn.innerText = "📸 SCAN & BOLO (TAP HERE)";
  }
});

// Replay button listener
replayBtn.addEventListener("click", () => {
  if (latestSpeechText) {
    speak(latestSpeechText);
  }
});