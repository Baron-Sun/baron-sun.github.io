(function () {
  "use strict";

  var root = document.querySelector("[data-citation-orbit]");
  if (!root) return;

  var dataNode = root.querySelector("[data-orbit-publications]");
  var controls = Array.prototype.slice.call(root.querySelectorAll("[data-orbit-filter]"));
  var networks = Array.prototype.slice.call(root.querySelectorAll("[data-orbit-network]"));
  var detailTitle = root.querySelector("[data-orbit-title]");
  var detailMeta = root.querySelector("[data-orbit-meta]");
  var detailNote = root.querySelector("[data-orbit-note]");
  var detailLink = root.querySelector("[data-orbit-link]");
  var announcement = root.querySelector("[data-orbit-announcement]");
  if (!dataNode || !controls.length || !networks.length || !detailTitle || !detailMeta || !detailNote || !detailLink) return;

  var papers;
  try {
    papers = JSON.parse(dataNode.textContent);
  } catch (error) {
    return;
  }

  var byKey = new Map(papers.map(function (paper) {
    return [paper.key, paper];
  }));
  var themeNotes = {
    privacy: "Connected themes: digital privacy, interactive agents, human agency, and cognitive support.",
    stop: "Connected themes: adaptive context, efficient inference, information sufficiency, and question answering.",
    capc: "Connected themes: adaptive policy communication, corpus building, expert-directed labels, and computational social science.",
    social: "Connected themes: social learning, information selection, algorithmic mediation, and collective judgment."
  };

  controls.forEach(function (button) {
    button.disabled = false;
  });
  root.classList.add("is-ready");

  function belongsTo(element, key) {
    return (element.getAttribute("data-pub") || "").split(/\s+/).indexOf(key) !== -1;
  }

  function selectPublication(key) {
    controls.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-orbit-filter") === key));
    });

    networks.forEach(function (network) {
      network.setAttribute("data-filtered", String(key !== "all"));
      Array.prototype.slice.call(network.querySelectorAll("[data-pub]")).forEach(function (element) {
        if (key === "all") {
          element.removeAttribute("data-active");
        } else {
          element.setAttribute("data-active", String(belongsTo(element, key)));
        }
      });
    });

    if (key === "all") {
      detailTitle.textContent = "Bolun Sun · research constellation";
      detailMeta.textContent = "Four current research outputs anchor the network; themes show their conceptual neighborhoods.";
      detailNote.textContent = "Citation counts are deliberately omitted while source coverage for these recent works remains incomplete.";
      detailLink.hidden = true;
      detailLink.removeAttribute("href");
      if (announcement) announcement.textContent = "Showing all four research outputs.";
      return;
    }

    var paper = byKey.get(key);
    if (!paper) return;
    detailTitle.textContent = paper.title;
    detailMeta.textContent = paper.authors + " — " + paper.venue;
    detailNote.textContent = themeNotes[key] || paper.description;
    detailLink.href = paper.url;
    detailLink.hidden = false;
    if (announcement) announcement.textContent = "Showing " + paper.title + ".";
  }

  controls.forEach(function (button) {
    button.addEventListener("click", function () {
      selectPublication(button.getAttribute("data-orbit-filter"));
    });
  });

  selectPublication("all");
})();
