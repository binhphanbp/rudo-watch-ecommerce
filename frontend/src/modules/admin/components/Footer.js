/**
 * AdminFooter Component
 * Chứa scripts cần thiết cho admin panel
 */
export function Footer() {
  return `
    <!-- Dark overlay for sidebar toggle -->
    <div class="dark-transparent sidebartoggler"></div>
  `;
}

/**
 * AdminScripts - Danh sách các scripts cần load cho admin panel
 * Sử dụng để tự động inject scripts vào cuối body
 */
export const AdminScripts = [
  "/src/modules/admin/styles/js/vendor.min.js",
  "/src/modules/admin/styles/js/bootstrap.bundle.min.js",
  "/src/modules/admin/styles/js/simplebar.min.js",
  "/src/modules/admin/styles/js/app.init.js",
  "/src/modules/admin/styles/js/theme.js",
  "/src/modules/admin/styles/js/app.min.js",
  "/src/modules/admin/styles/js/sidebarmenu.js",
];

/**
 * AdminExternalScripts - CDN scripts
 */
export const AdminExternalScripts = [
  "https://cdn.jsdelivr.net/npm/iconify-icon@1.0.8/dist/iconify-icon.min.js",
];

/**
 * Load scripts dynamically
 * @param {string[]} scripts - Array of script URLs
 * @returns {Promise} - Resolves when all scripts are loaded
 */
export function loadScripts(scripts) {
  return Promise.all(
    scripts.map((src) => {
      return new Promise((resolve, reject) => {
        // Check if script already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    })
  );
}

/**
 * Initialize Highlight.js after scripts loaded
 */
export function initHighlightJS() {
  if (typeof hljs !== "undefined") {
    hljs.initHighlightingOnLoad();
    document.querySelectorAll("pre.code-view > code").forEach((codeBlock) => {
      codeBlock.textContent = codeBlock.innerHTML;
    });
  }
}

/**
 * Full initialization sequence for admin footer scripts
 */
export async function initAdminScripts() {
  try {
    // Load core scripts first
    await loadScripts(AdminScripts);

    // Load external scripts
    await loadScripts(AdminExternalScripts);

    // Initialize highlight.js if available
    await loadScripts(["/src/modules/admin/styles/js/highlight.min.js"]);
    initHighlightJS();

    console.log("[AdminFooter] All scripts loaded successfully");
  } catch (error) {
    console.error("[AdminFooter] Error loading scripts:", error);
  }
}
