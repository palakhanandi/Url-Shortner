const BASE_URL = "http://localhost:5000";

async function shorten() {
  const url = document.getElementById("url").value.trim();
  const alias = document.getElementById("alias").value.trim();

  if (!url) {
    alert("Please enter a URL");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        originalUrl: url,
        customAlias: alias
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Something went wrong");
      return;
    }

    const shortId = data.shortUrl.split("/").pop();

    document.getElementById("result").innerHTML = `
      <p><strong>Short URL:</strong></p>
      <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>
      <button onclick="copyLink('${data.shortUrl}')">📋 Copy</button>
    `;

    // QR Code
    const qrRes = await fetch(`${BASE_URL}/api/qrcode/${shortId}`);
    const qrData = await qrRes.json();

    document.getElementById("qr").innerHTML = `
      <img src="${qrData.qr}" alt="QR Code" />
    `;

    // Load analytics + auto refresh
    loadAnalytics(shortId);

    if (window.analyticsInterval) {
      clearInterval(window.analyticsInterval);
    }

    window.analyticsInterval = setInterval(() => {
      loadAnalytics(shortId);
    }, 2000);

  } catch (error) {
    console.error(error);
    alert("Server error. Make sure backend is running.");
  }
}

async function loadAnalytics(shortId) {
  try {
    const res = await fetch(`${BASE_URL}/api/analytics/${shortId}`);
    const data = await res.json();

    if (!res.ok) return;

    document.getElementById("analytics").innerHTML = `
      <div class="analytics-box">
        <h3>📊 Analytics</h3>
        <p><strong>Clicks:</strong> ${data.clicks}</p>
        <p><strong>Created:</strong> ${data.createdAt}</p>
      </div>
    `;
  } catch (err) {
    console.error("Analytics error:", err);
  }
}

function copyLink(link) {
  navigator.clipboard.writeText(link);
  alert("Short URL copied!");
}

