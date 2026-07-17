(function () {
  "use strict";

  var portraitStage = document.querySelector("[data-portrait-motion]");
  var portrait = portraitStage && portraitStage.querySelector(".portrait-motion");
  var motionAllowed = window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (portraitStage && portrait && motionAllowed) {
    var portraitFrame;

    portraitStage.addEventListener("pointermove", function (event) {
      var rect = portraitStage.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;

      window.cancelAnimationFrame(portraitFrame);
      portraitFrame = window.requestAnimationFrame(function () {
        portrait.classList.add("is-tracking");
        portrait.style.setProperty("--portrait-rx", (-y * 2.8) + "deg");
        portrait.style.setProperty("--portrait-ry", (x * 2.8) + "deg");
        portrait.style.setProperty("--portrait-lx", ((x + 0.5) * 100) + "%");
        portrait.style.setProperty("--portrait-ly", ((y + 0.5) * 100) + "%");
      });
    }, { passive: true });

    var resetPortrait = function () {
      window.cancelAnimationFrame(portraitFrame);
      portrait.classList.remove("is-tracking");
      portrait.style.setProperty("--portrait-rx", "0deg");
      portrait.style.setProperty("--portrait-ry", "0deg");
      portrait.style.setProperty("--portrait-lx", "50%");
      portrait.style.setProperty("--portrait-ly", "40%");
    };

    portraitStage.addEventListener("pointerleave", resetPortrait);
    portraitStage.addEventListener("pointercancel", resetPortrait);
    window.addEventListener("blur", resetPortrait);
  }

  var copyButton = document.querySelector("[data-copy-text]");
  var copyStatus = document.querySelector("[data-copy-status]");

  if (copyButton && copyStatus) {
    var copyStatusTimer;

    var legacyCopy = function (value) {
      return new Promise(function (resolve, reject) {
        var textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();

        var copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (error) {
          copied = false;
        }

        document.body.removeChild(textArea);
        if (copied) {
          resolve();
        } else {
          reject(new Error("Clipboard API unavailable"));
        }
      });
    };

    copyButton.addEventListener("click", function () {
      var value = copyButton.getAttribute("data-copy-text");
      var copyPromise;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        copyPromise = navigator.clipboard.writeText(value).catch(function () {
          return legacyCopy(value);
        });
      } else {
        copyPromise = legacyCopy(value);
      }

      copyPromise.then(function () {
        window.clearTimeout(copyStatusTimer);
        copyButton.classList.add("is-copied");
        copyStatus.textContent = "Copied";
        copyStatusTimer = window.setTimeout(function () {
          copyButton.classList.remove("is-copied");
          copyStatus.textContent = "";
        }, 1800);
      }).catch(function () {
        window.clearTimeout(copyStatusTimer);
        copyButton.classList.remove("is-copied");
        copyStatus.textContent = "Copy unavailable — select the ID manually";
      });
    });
  }
})();
