(function () {
  "use strict";

  var root = document.querySelector("[data-research-braid]");
  if (!root) return;

  var plot = root.querySelector(".research-braid__plot");
  var svg = root.querySelector(".research-braid__edges");
  var status = root.querySelector("[data-braid-status]");
  var dataNode = root.querySelector("[data-braid-links]");
  var buttons = Array.prototype.slice.call(root.querySelectorAll("[data-braid-id]"));
  if (!plot || !svg || !status || !dataNode || !buttons.length) return;

  var links;
  try {
    links = JSON.parse(dataNode.textContent);
  } catch (error) {
    return;
  }

  buttons.forEach(function (button) {
    button.disabled = false;
  });
  root.classList.add("is-ready");

  var buttonById = new Map(buttons.map(function (button) {
    return [button.getAttribute("data-braid-id"), button];
  }));
  var methodLinks = links.methodLinks || [];
  var paperLinks = links.paperLinks || [];
  var allEdges = methodLinks.concat(paperLinks);
  var selectedId = "p-social";
  var previewId = null;
  var activeEdges = new Set();

  function edgeKey(from, to) {
    return from + "|" + to;
  }

  function nodeType(id) {
    if (id.indexOf("m-") === 0) return "method";
    if (id.indexOf("q-") === 0) return "phenomenon";
    return "paper";
  }

  function activePath(id) {
    var type = nodeType(id);
    var nodeIds = new Set([id]);
    var edgeKeys = new Set();

    if (type === "method") {
      methodLinks.forEach(function (edge) {
        if (edge[0] !== id) return;
        nodeIds.add(edge[1]);
        edgeKeys.add(edgeKey(edge[0], edge[1]));
      });
      paperLinks.forEach(function (edge) {
        if (!nodeIds.has(edge[0])) return;
        nodeIds.add(edge[1]);
        edgeKeys.add(edgeKey(edge[0], edge[1]));
      });
    }

    if (type === "phenomenon") {
      methodLinks.forEach(function (edge) {
        if (edge[1] !== id) return;
        nodeIds.add(edge[0]);
        edgeKeys.add(edgeKey(edge[0], edge[1]));
      });
      paperLinks.forEach(function (edge) {
        if (edge[0] !== id) return;
        nodeIds.add(edge[1]);
        edgeKeys.add(edgeKey(edge[0], edge[1]));
      });
    }

    if (type === "paper") {
      paperLinks.forEach(function (edge) {
        if (edge[1] !== id) return;
        nodeIds.add(edge[0]);
        edgeKeys.add(edgeKey(edge[0], edge[1]));
      });
      methodLinks.forEach(function (edge) {
        if (!nodeIds.has(edge[1])) return;
        nodeIds.add(edge[0]);
        edgeKeys.add(edgeKey(edge[0], edge[1]));
      });
    }

    return { nodeIds: nodeIds, edgeKeys: edgeKeys };
  }

  function connectionPath(source, target, plotRect) {
    var sourceRect = source.getBoundingClientRect();
    var targetRect = target.getBoundingClientRect();
    var stacked = targetRect.top > sourceRect.bottom + 20;

    if (stacked) {
      var sx = sourceRect.left + sourceRect.width / 2 - plotRect.left;
      var sy = sourceRect.bottom - plotRect.top;
      var tx = targetRect.left + targetRect.width / 2 - plotRect.left;
      var ty = targetRect.top - plotRect.top;
      var middleY = sy + (ty - sy) / 2;
      return "M " + sx + " " + sy + " C " + sx + " " + middleY + ", " + tx + " " + middleY + ", " + tx + " " + ty;
    }

    var x1 = sourceRect.right - plotRect.left;
    var y1 = sourceRect.top + sourceRect.height / 2 - plotRect.top;
    var x2 = targetRect.left - plotRect.left;
    var y2 = targetRect.top + targetRect.height / 2 - plotRect.top;
    var middleX = x1 + (x2 - x1) / 2;
    return "M " + x1 + " " + y1 + " C " + middleX + " " + y1 + ", " + middleX + " " + y2 + ", " + x2 + " " + y2;
  }

  function drawEdges() {
    var plotRect = plot.getBoundingClientRect();
    var width = Math.max(1, plotRect.width);
    var height = Math.max(1, plotRect.height);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    allEdges.slice().sort(function (a, b) {
      return Number(activeEdges.has(edgeKey(a[0], a[1]))) - Number(activeEdges.has(edgeKey(b[0], b[1])));
    }).forEach(function (edge) {
      var source = buttonById.get(edge[0]);
      var target = buttonById.get(edge[1]);
      if (!source || !target) return;
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      var active = activeEdges.has(edgeKey(edge[0], edge[1]));
      path.setAttribute("d", connectionPath(source, target, plotRect));
      path.setAttribute("class", active ? "research-braid__edge is-active" : "research-braid__edge");
      svg.appendChild(path);
    });
  }

  function render(id, announce) {
    var path = activePath(id);
    activeEdges = path.edgeKeys;

    buttons.forEach(function (button) {
      var buttonId = button.getAttribute("data-braid-id");
      button.classList.toggle("is-in-path", path.nodeIds.has(buttonId));
      button.classList.toggle("is-selected", buttonId === id);
      button.setAttribute("aria-pressed", String(buttonId === selectedId));
    });

    var activeButton = buttonById.get(id);
    if (activeButton && announce !== false) {
      status.textContent = activeButton.getAttribute("data-braid-description") || "";
    }
    drawEdges();
  }

  buttons.forEach(function (button) {
    var id = button.getAttribute("data-braid-id");

    button.addEventListener("pointerenter", function () {
      previewId = id;
      render(id, true);
    });
    button.addEventListener("pointerleave", function () {
      previewId = null;
      render(selectedId, false);
    });
    button.addEventListener("focus", function () {
      previewId = id;
      render(id, true);
    });
    button.addEventListener("blur", function (event) {
      if (event.relatedTarget && root.contains(event.relatedTarget)) return;
      previewId = null;
      render(selectedId, false);
    });
    button.addEventListener("click", function () {
      selectedId = id;
      previewId = id;
      render(id, true);
    });
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(drawEdges).observe(plot);
  } else {
    window.addEventListener("resize", drawEdges);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(drawEdges);
  }

  render(selectedId, false);
})();
