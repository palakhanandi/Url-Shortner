async function shorten() {
  const url = document.getElementById("url").value.trim();
  const alias = document.getElementById("alias").value.trim();

  if (!url) {
    alert("Please enter a URL");
    return;
  }

  const res = await fetch("/api/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalUrl: url, customAlias: alias })
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error);
    return;
  }

  const shortId = data.shortUrl.split("/").pop();

  document.getElementById("result").innerHTML = `
    <p><strong>Short URL:</strong></p>
    <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>
    <button onclick="copyLink('${data.shortUrl}')">📋 Copy</button>
  `;

  const qrRes = await fetch(`/api/qrcode/${shortId}`);
  const qrData = await qrRes.json();

  document.getElementById("qr").innerHTML = `
    <img src="${qrData.qr}" alt="QR Code" />
  `;

  loadAnalytics(shortId);
}

async function loadAnalytics(shortId) {
  const res = await fetch(`/api/analytics/${shortId}`);
  const data = await res.json();

  document.getElementById("analytics").innerHTML = `
    <div class="analytics-box">
      <h3>📊 Analytics</h3>
      <p><strong>Clicks:</strong> ${data.clicks}</p>
      <p><strong>Created:</strong> ${data.createdAt}</p>
    </div>
  `;
}

function copyLink(link) {
  navigator.clipboard.writeText(link);
  alert("Short URL copied!");
}

