function updateOfflineStatus() {
  const el = document.getElementById("offline-indicator");
  if (!el) return;

  if (navigator.onLine) {
    el.textContent = "Online";
    el.classList.remove("offline");
    el.classList.add("online");
  } else {
    el.textContent = "Offline";
    el.classList.remove("online");
    el.classList.add("offline");
  }
}

window.addEventListener("online", updateOfflineStatus);
window.addEventListener("offline", updateOfflineStatus);
updateOfflineStatus();
