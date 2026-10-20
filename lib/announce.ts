// Speaks a message through the page-level status region in app/layout.tsx. Clearing first makes a repeat of the
// same message announce again. Same behavior as announce() in legacy/js/app-with-cover.js.
export function announce(message: string): void {
  const region = document.getElementById('pageStatus');
  if (!region) return;
  region.textContent = '';
  setTimeout(() => { region.textContent = message; }, 50);
}
