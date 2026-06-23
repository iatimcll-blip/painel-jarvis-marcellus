(function () {
  "use strict";

  /* ============================================================
     CONSTANTES
     ============================================================ */
  const DISPLAY_NAME = "Painel Jarvis · Marcellus";
  const SUBTITLE     = "B2B · MCLL · Multi-Estado";

  let syncTimer = null;

  /* ============================================================
     FORÇA TEMA ESCURO IMEDIATAMENTE
     ============================================================ */
  document.documentElement.setAttribute("data-theme", "dark");
  document.documentElement.style.colorScheme = "dark";

  /* ============================================================
     HELPERS
     ============================================================ */
  function svg(path) {
    return (
      '<svg width="15" height="15" fill="none" stroke="currentColor" ' +
      'stroke-width="2" viewBox="0 0 24 24">' + path + "</svg>"
    );
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* ============================================================
     BUILD HEADER
     Preserva #fileInput no DOM; muda apenas a camada visual.
     ============================================================ */
  function buildHeader() {
    var header = document.querySelector(".header");
    if (!header || header.dataset.redesignReady === "true") return;
    header.dataset.redesignReady = "true";

    /* ---- Brand ---- */
    var brand = document.createElement("div");
    brand.className = "redesign-brand";

    var logo = document.createElement("div");
    logo.className = "redesign-logo-letter";
    logo.textContent = "A";

    var brandText = document.createElement("div");

    var title = document.createElement("div");
    title.className = "redesign-title";
    title.textContent = DISPLAY_NAME;

    var sub = document.createElement("div");
    sub.className = "redesign-subtitle";
    sub.id = "redesignSubtitle";

    /* Move #updatedAt para dentro do subtítulo (render() continua a atualizá-lo) */
    var updatedAt = document.getElementById("updatedAt");
    sub.appendChild(document.createTextNode(SUBTITLE + " · "));
    if (updatedAt) {
      sub.appendChild(updatedAt);
    }

    brandText.appendChild(title);
    brandText.appendChild(sub);
    brand.appendChild(logo);
    brand.appendChild(brandText);

    /* Insere brand no início do header (antes do h1 original, que fica oculto via CSS) */
    header.insertBefore(brand, header.firstChild);

    /* ---- Actions ---- */
    var actions = document.createElement("div");
    actions.className = "redesign-actions";

    /* Pulso */
    var pulseTag = document.createElement("div");
    pulseTag.className = "redesign-pulse-tag";
    pulseTag.innerHTML = '<span class="redesign-pulse"></span> Monitoramento ativo';
    actions.appendChild(pulseTag);

    /* Upload — label aponta para #fileInput que permanece no DOM */
    var uploadLabel = document.createElement("label");
    uploadLabel.className = "btn";
    uploadLabel.htmlFor = "fileInput";
    uploadLabel.innerHTML =
      svg('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>') +
      " Carregar .xlsx";
    actions.appendChild(uploadLabel);

    /* Exportar PNG */
    var exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "btn btn-accent";
    exportBtn.innerHTML =
      svg(
        '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>' +
        '<polyline points="7 10 12 15 17 10"/>' +
        '<line x1="12" y1="15" x2="12" y2="3"/>'
      ) + " Exportar";
    exportBtn.addEventListener("click", exportPNG);
    actions.appendChild(exportBtn);

    header.appendChild(actions);
  }

  function exportPNG() {
    if (typeof html2canvas === "undefined") return;
    var node = document.querySelector(".container") || document.body;
    html2canvas(node, { backgroundColor: "#0a0e14", scale: 2, logging: false }).then(function (canvas) {
      var a = document.createElement("a");
      a.download = "painel_b2b_abertos.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    });
  }

  /* ============================================================
     RELOCATE FILTERS
     Move a .filters para uma barra dedicada abaixo do header.
     ============================================================ */
  function relocateFilters() {
    if (document.querySelector(".redesign-filter-bar")) return;

    var filters = document.querySelector(".filters");
    var container = document.querySelector(".container");
    if (!filters || !container) return;

    var bar = document.createElement("div");
    bar.className = "redesign-filter-bar";

    var filterTitle = document.createElement("div");
    filterTitle.className = "redesign-filter-title";
    filterTitle.textContent = "Filtros";

    bar.appendChild(filterTitle);
    bar.appendChild(filters);

    /* Insere após .kpi-row se existir; senão no início do container */
    var kpiRow = container.querySelector(".kpi-row");
    if (kpiRow) {
      kpiRow.insertAdjacentElement("afterend", bar);
    } else {
      container.insertBefore(bar, container.firstChild);
    }
  }

  /* ============================================================
     STATUS ENGINE — mesma lógica do painel_secundario.html
     >= : ok se val>=meta; warn se val>=meta*0,95; crit c.c.
     <= : ok se val<=meta; warn se val<=meta*1,15; crit c.c.
     ============================================================ */
  function computeStatus(val, meta, dir) {
    if (dir === ">=") {
      if (val >= meta)        return "ok";
      if (val >= meta * 0.95) return "warn";
      return "crit";
    } else {
      if (val <= meta)        return "ok";
      if (val <= meta * 1.15) return "warn";
      return "crit";
    }
  }

  var BADGE_LABEL = { ok: "Meta atingida", warn: "Atenção", crit: "Crítico", neutral: "Monitorando" };

  function getKpiInfo(index, data) {
    var total = data.length;

    if (index === 0) {
      /* Total abertos — neutro, barra proporcional a 80 tickets */
      var pct = Math.min(100, (total / 80) * 100);
      return { st: "neutral", pct: pct, badge: BADGE_LABEL.neutral, meta: "Total de chamados em fila" };
    }

    if (index === 1) {
      /* SLA médio — meta ≤ 8 h */
      var avgSla = total ? data.reduce(function (a, d) { return a + (d.sla || 0); }, 0) / total : 0;
      var st = computeStatus(avgSla, 8, "<=");
      var pct = Math.min(100, Math.max(0, (1 - avgSla / 24) * 100));
      return { st: st, pct: pct, badge: BADGE_LABEL[st], meta: "Meta ≤ 8 h · Limite atenção 9,2 h" };
    }

    if (index === 2) {
      /* Outlier ≥ 24 h — meta 0 */
      var critCount = data.filter(function (d) { return d.sla >= 24; }).length;
      var st = critCount === 0 ? "ok" : computeStatus(critCount, 3, "<=");
      var pct = total ? Math.max(0, 100 - (critCount / total) * 100) : 100;
      return { st: st, pct: pct, badge: BADGE_LABEL[st], meta: "Tickets com SLA ≥ 24 h" };
    }

    if (index === 3) {
      /* Pendente agendamento — meta 0 */
      var pendCount = data.filter(function (d) {
        return (d.substatus || "").toUpperCase().includes("PENDENTE");
      }).length;
      var st = pendCount === 0 ? "ok" : computeStatus(pendCount, 5, "<=");
      var pct = total ? Math.max(0, 100 - (pendCount / total) * 100) : 100;
      return { st: st, pct: pct, badge: BADGE_LABEL[st], meta: "Substatus: pendente agendamento" };
    }

    return { st: "neutral", pct: 50, badge: BADGE_LABEL.neutral, meta: "" };
  }

  /* ============================================================
     ENHANCE KPI CARDS
     Adiciona .kpi-top, .kpi-badge, .kpi-bar, .redesign-kpi-meta
     ============================================================ */
  function enhanceKpis() {
    var cards = Array.from(document.querySelectorAll(".kpi"));
    var data = [];
    try { if (typeof DATA !== "undefined" && Array.isArray(DATA)) data = DATA; } catch (e) {}

    cards.forEach(function (card, idx) {
      var info = getKpiInfo(idx, data);

      /* Atualiza classe de status */
      card.classList.remove("s-ok", "s-warn", "s-crit", "s-neutral");
      card.classList.add("s-" + info.st);

      /* ----- Estrutura: kpi-top (label + badge) ----- */
      if (!card.querySelector(".kpi-top")) {
        var label = card.querySelector(".kpi-label");
        var valEl  = card.querySelector(".kpi-value");
        var top    = document.createElement("div");
        top.className = "kpi-top";

        var badge = document.createElement("span");
        badge.className = "kpi-badge s-" + info.st;
        badge.textContent = info.badge;

        if (label) {
          card.insertBefore(top, label);
          top.appendChild(label);
          top.appendChild(badge);
        }
      } else {
        /* Atualiza badge existente */
        var badge = card.querySelector(".kpi-badge");
        if (badge) {
          badge.className = "kpi-badge s-" + info.st;
          badge.textContent = info.badge;
        }
      }

      /* ----- Barra de progresso ----- */
      var bar = card.querySelector(".kpi-bar");
      if (!bar) {
        bar = document.createElement("div");
        bar.className = "kpi-bar";
        bar.innerHTML = "<i></i>";
        var valEl = card.querySelector(".kpi-value");
        if (valEl) {
          valEl.insertAdjacentElement("afterend", bar);
        } else {
          card.appendChild(bar);
        }
      }
      var barI = bar.querySelector("i");
      if (barI) {
        barI.className = "s-" + info.st;
        barI.style.width = Math.round(info.pct) + "%";
      }

      /* ----- Meta / rodapé ----- */
      var meta = card.querySelector(".redesign-kpi-meta");
      if (!meta) {
        meta = document.createElement("div");
        meta.className = "redesign-kpi-meta";
        card.appendChild(meta);
      }
      meta.textContent = info.meta;
    });
  }

  /* ============================================================
     CHART PALETTE — dark executive
     Ajusta chartUF e chartAging do painel_atrix.html
     ============================================================ */
  function applyChartPalette() {
    var ok       = cssVar("--ok")       || "#2ecc8f";
    var warn     = cssVar("--warn")     || "#f5a623";
    var crit     = cssVar("--crit")     || "#ff5c5c";
    var accent   = cssVar("--accent")   || "#f59e0b";
    var accent2  = cssVar("--accent-2") || "#3b82f6";
    var textMuted = cssVar("--text-3")  || "#5b6677";
    var gridColor = "rgba(255,255,255,.04)";
    var tickFont  = { size: 10, family: "'JetBrains Mono', monospace" };

    function patchScales(scales) {
      if (!scales) return;
      Object.keys(scales).forEach(function (key) {
        var s = scales[key];
        s.ticks = s.ticks || {};
        s.grid  = s.grid  || {};
        s.ticks.color = textMuted;
        s.ticks.font  = tickFont;
        s.grid.color  = gridColor;
      });
    }

    function patchChart(chart, colors) {
      if (!chart || !chart.data || !chart.data.datasets) return;
      chart.data.datasets.forEach(function (ds, i) {
        var c = Array.isArray(colors[0]) ? colors[i] || colors[0] : colors;
        ds.backgroundColor = c;
        if (typeof c === "string") ds.borderColor = c;
        ds.borderWidth = 0;
      });
      if (chart.options) {
        patchScales(chart.options.scales);
        var lbl = ((chart.options.plugins || {}).legend || {}).labels;
        if (lbl) lbl.color = textMuted;
      }
      chart.update("none");
    }

    try {
      if (typeof chartUF !== "undefined" && chartUF) {
        var n = (chartUF.data.labels || []).length;
        var palette = [accent, accent2, ok, warn, crit, "#a855f7"].slice(0, n);
        patchChart(chartUF, palette);
      }
    } catch (e) {}

    try {
      if (typeof chartAging !== "undefined" && chartAging) {
        patchChart(chartAging, [ok, ok, warn, crit, crit]);
      }
    } catch (e) {}
  }

  /* ============================================================
     FOOTER
     ============================================================ */
  function buildFooter() {
    var container = document.querySelector(".container");
    if (!container || document.querySelector(".redesign-footer")) return;
    var footer = document.createElement("footer");
    footer.className = "redesign-footer";
    footer.textContent = "© 2026 · MCLL Monitoramento B2B · Wanderson Marcellus Penha Costa";
    container.appendChild(footer);
  }

  /* ============================================================
     SYNC ALL — chamado no init e periodicamente
     ============================================================ */
  function syncAll() {
    enhanceKpis();
    applyChartPalette();
  }

  function scheduleSync(delay) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncAll, delay || 150);
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    buildHeader();
    relocateFilters();
    buildFooter();
    scheduleSync(200);

    /* Re-sync após upload de arquivo */
    var fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.addEventListener("change", function () { scheduleSync(350); });
    }

    /* Re-sync em resize (gráficos podem ser recriados) */
    window.addEventListener("resize", function () { scheduleSync(150); });

    /* Ciclo de atualização contínua */
    window.setInterval(syncAll, 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
