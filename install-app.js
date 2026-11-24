(() => {
  const trigger = document.querySelector("[data-install-trigger]");
  const guide = document.querySelector("[data-install-guide]");
  const success = document.querySelector("[data-install-success]");
  const button = trigger instanceof HTMLButtonElement ? trigger : null;
  let installPrompt;

  function showInstalled() {
    installPrompt = undefined;
    trigger.hidden = true;
    if (guide) guide.hidden = true;
    if (success) success.hidden = false;
  }

  if (trigger) {
    if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true) {
      showInstalled();
    } else {
      window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        installPrompt = event;
        if (button) button.hidden = false;
      });
      window.addEventListener("appinstalled", showInstalled);
      trigger.addEventListener("click", async event => {
        if (!installPrompt || event.defaultPrevented ||
            event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

        event.preventDefault();
        const prompt = installPrompt;
        installPrompt = undefined;
        if (button) button.hidden = true;

        try {
          await prompt.prompt();
        } catch {
          if (trigger instanceof HTMLAnchorElement) window.location.assign(trigger.href);
        }
      });
    }
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch(error => {
      console.warn("Could not enable offline access to Robey Productions.", error);
    });
  }
})();
