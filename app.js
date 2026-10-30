// 링크 모음 페이지: data.json을 읽어 채널별 영상·상품 목록을 그린다.
(function () {
  const BASE = window.LINKHUB_BASE || "./";
  const THEME = {
    g: { bg1: "#0b1426", bg2: "#142744", acc: "#ffb547", acc2: "#ff7a3d" },
    m: { bg1: "#16070b", bg2: "#2b0d14", acc: "#ff6b7d", acc2: "#5fd8de" },
  };
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let data = null;
  let cur = window.LINKHUB_PRESET || new URLSearchParams(location.search).get("c") || (location.hash === "#m" ? "m" : "g");
  if (!THEME[cur]) cur = "g";

  // ── 로우폴리 배경 (채널 색으로 삼각형 메시) ──
  const cv = $("#poly"), cx = cv.getContext("2d");
  function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function mix(a, b, t) {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
  }
  function drawPoly() {
    const th = THEME[cur], dpr = Math.min(devicePixelRatio || 1, 2);
    const W = innerWidth, H = Math.max(innerHeight, 700);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px";
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = rnd(cur === "g" ? 1027 : 2048), cell = 90, cols = Math.ceil(W / cell) + 2, rows = Math.ceil(H / cell) + 2, pts = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
      pts.push([(x - 0.5 + (r() - 0.5) * 0.8) * cell, (y - 0.5 + (r() - 0.5) * 0.8) * cell]);
    for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols - 1; x++) {
      const a = pts[y * cols + x], b = pts[y * cols + x + 1], c = pts[(y + 1) * cols + x], d = pts[(y + 1) * cols + x + 1];
      for (const tri of [[a, b, c], [b, d, c]]) {
        const my = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, mx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
        let t = Math.min(1, Math.max(0, my / H)) * 0.85 + r() * 0.15;
        cx.fillStyle = mix(th.bg2, th.bg1, t);
        // 오른쪽 위에 강조색 빛
        const glow = Math.max(0, 1 - Math.hypot(mx - W * 0.85, my - 40) / (W * 0.55));
        if (glow > 0) cx.fillStyle = mix(cx.fillStyle.startsWith("#") ? cx.fillStyle : th.bg2, th.acc, glow * 0.22 * (0.6 + r() * 0.4));
        cx.beginPath(); cx.moveTo(...tri[0]); cx.lineTo(...tri[1]); cx.lineTo(...tri[2]); cx.closePath(); cx.fill();
        cx.strokeStyle = "rgba(255,255,255,0.025)"; cx.stroke();
      }
    }
  }

  function setTheme() {
    const th = THEME[cur], r = document.documentElement.style;
    r.setProperty("--acc", th.acc); r.setProperty("--acc2", th.acc2); r.setProperty("--bg", th.bg1);
    document.querySelector('meta[name="theme-color"]').setAttribute("content", th.bg1);
    drawPoly();
  }

  function render() {
    const ch = data.channels[cur];
    document.title = `${ch.name} 링크 모음`;
    document.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.c === cur));
    $("#profile").innerHTML = `
      <img src="${BASE + esc(ch.img)}" alt="" width="88" height="88">
      <div><h1>${esc(ch.name)}<span>${esc(ch.sub)}</span></h1><p>${esc(ch.tagline)}</p></div>`;
    $("#social").innerHTML = Object.entries(ch.social).map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k)}</a>`).join("");

    const q = ($("#q").value || "").trim().toLowerCase();
    const posts = data.posts.filter((p) => p.channel === cur)
      .filter((p) => !q || String(p.no) === q.replace(/^#|번$/g, "") || (p.title + (p.items || []).map((i) => i.name).join(" ")).toLowerCase().includes(q))
      .sort((a, b) => b.no - a.no);

    const lf = ch.longform && !q ? `
      <article class="post lf">
        <a class="lfbtn" href="${esc(ch.longform.url)}" target="_blank" rel="noopener">▶ 전체 영상 보기 <small>유튜브 롱폼</small></a>
        <header><div><h2>${esc(ch.longform.title)}</h2><time>${esc(ch.longform.date || "")}</time></div></header>
        ${(ch.longform.items || []).map((it) => `
          <a class="item" href="${esc(it.url)}" target="_blank" rel="noopener sponsored">
            <span class="nm">${esc(it.name)}</span>${it.why ? `<span class="why">${esc(it.why)}</span>` : ""}
            <span class="go">쿠팡에서 보기 →</span>
          </a>`).join("")}
      </article>` : "";
    $("#list").innerHTML = lf + (posts.length ? posts.map((p) => `
      <article class="post" id="v${p.no}">
        <header><b class="no">${p.no}</b><div><h2>${esc(p.title)}</h2><time>${esc(p.date)}</time></div></header>
        ${(p.items || []).map((it) => `
          <a class="item" href="${esc(it.url)}" target="_blank" rel="noopener sponsored">
            <span class="nm">${esc(it.name)}</span>${it.why ? `<span class="why">${esc(it.why)}</span>` : ""}
            <span class="go">쿠팡에서 보기 →</span>
          </a>`).join("")}
      </article>`).join("")
      : `<p class="empty">${q ? "찾는 영상이 없어요. 영상 번호로 검색해 보세요." : "첫 영상의 링크를 준비하고 있어요."}</p>`);
    $("#note").textContent = ch.note;

    // 해시로 특정 영상 바로 가기 (#v3)
    const h = location.hash.match(/^#v(\d+)/);
    if (h) { const el = document.getElementById("v" + h[1]); if (el) { el.classList.add("hit"); el.scrollIntoView({ block: "start" }); } }
  }

  function go(c) {
    if (c === cur || !THEME[c]) return;
    cur = c;
    if (!window.LINKHUB_PRESET) history.replaceState(null, "", "?c=" + c);
    setTheme(); render();
  }

  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
    if (window.LINKHUB_PRESET) location.href = BASE + b.dataset.c + "/"; else go(b.dataset.c);
  }));
  $("#q").addEventListener("input", render);
  addEventListener("resize", () => { clearTimeout(window.__rz); window.__rz = setTimeout(drawPoly, 150); });

  setTheme();
  fetch(BASE + "data.json?" + Date.now()).then((r) => r.json()).then((d) => {
    data = d; $("#disc").textContent = d.disclosure; render();
  }).catch(() => { $("#list").innerHTML = `<p class="empty">잠시 후 다시 열어 주세요.</p>`; });
})();
