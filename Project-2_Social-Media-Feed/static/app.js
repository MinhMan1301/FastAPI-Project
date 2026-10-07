const password = document.getElementById("password");
const toggle = document.getElementById("toggle");

toggle.addEventListener("click", () => {
  const show = password.type === "password";
  password.type = show ? "text" : "password";
  toggle.textContent = show ? "Hide" : "Show";
  toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
});

// UI only: stop the form from reloading the page
document.getElementById("loginForm").addEventListener("submit", (e) => e.preventDefault());