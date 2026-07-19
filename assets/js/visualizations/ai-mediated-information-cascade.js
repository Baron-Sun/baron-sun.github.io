(function () {
  "use strict";

  var root = document.querySelector("[data-information-cascade]");
  if (!root) return;

  var plot = root.querySelector("[data-cascade-plot]");
  var edgeLayer = root.querySelector("[data-cascade-edges]");
  var selectedList = root.querySelector("[data-cascade-selected-list]");
  var roundsRoot = root.querySelector("[data-cascade-rounds]");
  var modeButtons = Array.prototype.slice.call(root.querySelectorAll("[data-cascade-mode]"));
  var sourceButtons = Array.prototype.slice.call(root.querySelectorAll(".information-cascade__source"));
  var coverage = root.querySelector("[data-cascade-coverage]");
  var concentration = root.querySelector("[data-cascade-concentration]");
  var omissions = root.querySelector("[data-cascade-omissions]");
  var status = root.querySelector("[data-cascade-status]");
  if (!plot || !edgeLayer || !selectedList || !roundsRoot || !modeButtons.length || !sourceButtons.length) return;

  var configurations = {
    broad: {
      selected: ["o1", "o2", "o4", "o5", "o6", "o8"],
      rounds: [
        ["o1", "o4", "o6"],
        ["o1", "o5", "o8"],
        ["o2", "o4", "o8"]
      ],
      trace: "o1"
    },
    concentrated: {
      selected: ["o2", "o3", "o7"],
      rounds: [
        ["o2", "o3", "o7"],
        ["o2", "o2", "o7"],
        ["o2", "o7", "o2"]
      ],
      trace: "o2"
    }
  };

  var currentMode = "broad";
  var tracedId = configurations[currentMode].trace;
  var resizeObserver;

  function labelFor(id) {
    return id.replace("o", "O");
  }

  function makeNode(id, className, ariaLabel) {
    var item = document.createElement("li");
    var button = document.createElement("button");
    button.type = "button";
    button.className = "information-cascade__node " + className;
    button.setAttribute("data-cascade-source", id);
    button.setAttribute("aria-label", ariaLabel);
    button.setAttribute("aria-pressed", "false");
    button.textContent = labelFor(id);
    item.appendChild(button);
    return item;
  }

  function bindTraceButtons() {
    Array.prototype.slice.call(root.querySelectorAll("[data-cascade-source]")).forEach(function (button) {
      button.disabled = false;
      if (button.getAttribute("data-cascade-bound") === "true") return;
      button.setAttribute("data-cascade-bound", "true");
      button.addEventListener("click", function () {
        tracedId = button.getAttribute("data-cascade-source");
        updateTrace(true);
      });
    });
  }

  function buildConfiguration() {
    var configuration = configurations[currentMode];
    selectedList.replaceChildren();
    roundsRoot.replaceChildren();

    configuration.selected.forEach(function (id) {
      selectedList.appendChild(makeNode(id, "information-cascade__selected-node", labelFor(id) + " passes the upstream selection gate"));
    });

    configuration.rounds.forEach(function (round, roundIndex) {
      var roundGroup = document.createElement("section");
      var roundLabel = document.createElement("p");
      var list = document.createElement("ol");
      roundGroup.className = "information-cascade__round";
      roundLabel.className = "information-cascade__round-label";
      roundLabel.textContent = "Round " + (roundIndex + 1);
      list.className = "information-cascade__signal-list";

      round.forEach(function (id, signalIndex) {
        list.appendChild(makeNode(id, "information-cascade__signal", labelFor(id) + " appears as signal " + (signalIndex + 1) + " in round " + (roundIndex + 1)));
      });

      roundGroup.appendChild(roundLabel);
      roundGroup.appendChild(list);
      roundsRoot.appendChild(roundGroup);
    });

    bindTraceButtons();
    updateMetrics();
    updateTrace(false);
  }

  function updateMetrics() {
    var configuration = configurations[currentMode];
    var totalObservations = sourceButtons.length;
    var omitted = totalObservations - configuration.selected.length;
    var signalCounts = {};
    var totalSignals = 0;
    configuration.rounds.forEach(function (round) {
      round.forEach(function (id) {
        signalCounts[id] = (signalCounts[id] || 0) + 1;
        totalSignals += 1;
      });
    });
    var topTwoSignals = Object.keys(signalCounts).map(function (id) {
      return signalCounts[id];
    }).sort(function (a, b) {
      return b - a;
    }).slice(0, 2).reduce(function (sum, count) {
      return sum + count;
    }, 0);

    coverage.textContent = configuration.selected.length + " of " + totalObservations + " available";
    concentration.textContent = "2 most repeated fill " + topTwoSignals + " of " + totalSignals + " slots";
    omissions.textContent = omitted + (omitted === 1 ? " observation" : " observations");
  }

  function traceSummary(id) {
    var configuration = configurations[currentMode];
    var selected = configuration.selected.indexOf(id) !== -1;
    if (!selected) {
      return "Trace of " + labelFor(id) + ": it exists in the original pool, but the AI does not surface it; later learners never see it.";
    }

    var appearances = 0;
    var visibleRounds = 0;
    var totalSignals = 0;
    configuration.rounds.forEach(function (round) {
      var count = round.filter(function (signal) { return signal === id; }).length;
      appearances += count;
      totalSignals += round.length;
      if (count) visibleRounds += 1;
    });

    if (!appearances) {
      return "Trace of " + labelFor(id) + ": the AI surfaces it, but it does not appear in the later rounds shown here.";
    }

    return "Trace of " + labelFor(id) + ": the AI surfaces it, and it appears in " + visibleRounds + " of " + configuration.rounds.length + " later rounds (" + appearances + " of " + totalSignals + " visible slots).";
  }

  function updateTrace(announce) {
    var configuration = configurations[currentMode];
    Array.prototype.slice.call(root.querySelectorAll("[data-cascade-source]")).forEach(function (button) {
      var id = button.getAttribute("data-cascade-source");
      var selected = configuration.selected.indexOf(id) !== -1;
      button.classList.toggle("is-selected-upstream", selected);
      button.classList.toggle("is-excluded-upstream", !selected);
      button.classList.toggle("is-traced", id === tracedId);
      button.classList.toggle("is-muted", id !== tracedId);
      button.setAttribute("aria-pressed", String(id === tracedId));
    });

    status.textContent = traceSummary(tracedId);
    if (announce) status.setAttribute("data-announced", String(Date.now()));
    drawEdges();
  }

  function connectionPath(source, target, plotRect) {
    var sourceRect = source.getBoundingClientRect();
    var targetRect = target.getBoundingClientRect();
    var stacked = targetRect.top > sourceRect.bottom + 24;

    if (stacked) {
      var sourceX = sourceRect.left + sourceRect.width / 2 - plotRect.left;
      var sourceY = sourceRect.bottom - plotRect.top;
      var targetX = targetRect.left + targetRect.width / 2 - plotRect.left;
      var targetY = targetRect.top - plotRect.top;
      var middleY = sourceY + (targetY - sourceY) / 2;
      return "M " + sourceX + " " + sourceY + " C " + sourceX + " " + middleY + ", " + targetX + " " + middleY + ", " + targetX + " " + targetY;
    }

    var x1 = sourceRect.right - plotRect.left;
    var y1 = sourceRect.top + sourceRect.height / 2 - plotRect.top;
    var x2 = targetRect.left - plotRect.left;
    var y2 = targetRect.top + targetRect.height / 2 - plotRect.top;
    var middleX = x1 + (x2 - x1) / 2;
    return "M " + x1 + " " + y1 + " C " + middleX + " " + y1 + ", " + middleX + " " + y2 + ", " + x2 + " " + y2;
  }

  function appendEdge(source, target, id, kind, plotRect) {
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", connectionPath(source, target, plotRect));
    path.setAttribute("pathLength", "1");
    path.setAttribute("class", "information-cascade__edge information-cascade__edge--" + kind + (id === tracedId ? " is-traced" : " is-muted"));
    path.setAttribute("data-cascade-edge", id);
    edgeLayer.appendChild(path);
  }

  function drawEdges() {
    var plotRect = plot.getBoundingClientRect();
    var width = Math.max(1, plotRect.width);
    var height = Math.max(1, plotRect.height);
    var configuration = configurations[currentMode];
    edgeLayer.setAttribute("viewBox", "0 0 " + width + " " + height);
    edgeLayer.setAttribute("width", String(width));
    edgeLayer.setAttribute("height", String(height));
    edgeLayer.replaceChildren();

    configuration.selected.forEach(function (id) {
      var source = root.querySelector(".information-cascade__source[data-cascade-source='" + id + "']");
      var selected = root.querySelector(".information-cascade__selected-node[data-cascade-source='" + id + "']");
      if (!source || !selected) return;
      appendEdge(source, selected, id, "selection", plotRect);

      Array.prototype.slice.call(root.querySelectorAll(".information-cascade__signal[data-cascade-source='" + id + "']")).forEach(function (signal) {
        appendEdge(selected, signal, id, "stream", plotRect);
      });
    });
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      currentMode = button.getAttribute("data-cascade-mode");
      tracedId = configurations[currentMode].trace;
      modeButtons.forEach(function (candidate) {
        candidate.setAttribute("aria-pressed", String(candidate === button));
      });
      buildConfiguration();
    });
  });

  sourceButtons.forEach(function (button) {
    button.disabled = false;
  });

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(drawEdges);
    resizeObserver.observe(plot);
  } else {
    window.addEventListener("resize", drawEdges);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(drawEdges);
  }

  buildConfiguration();
})();
