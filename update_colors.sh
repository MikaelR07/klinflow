#!/bin/bash
# Update tailwind.config.js for client
sed -i 's/primary: "#00A651"/primary: "#2b9e31"/g' apps/client/tailwind.config.js
# Update tailwind.config.js for agent
sed -i 's/primary: "#00A651"/primary: "#2b9e31"/g' apps/agent/tailwind.config.js

# Append dark mode overrides to packages/ui/src/index.css
cat << 'CSSEOF' >> packages/ui/src/index.css

/* ── KLINFLOW CUSTOM DARK MODE (Global Override) ── */
.dark body {
  background-color: #0B0F14 !important;
}

.dark .bg-slate-900,
.dark .bg-slate-800,
.dark .bg-slate-950,
.dark .card,
.dark .glass {
  background-color: #161D26 !important;
}

.dark .text-white,
.dark .text-slate-50,
.dark h1, .dark h2, .dark h3, .dark h4, .dark h5, .dark h6 {
  color: #F3F4F6 !important;
}

.dark .text-slate-400,
.dark .text-slate-500 {
  color: #9CA3AF !important;
}

.dark .border-slate-800,
.dark .border-slate-700,
.dark .border-slate-800\/40,
.dark .border-slate-800\/80 {
  border-color: rgba(255, 255, 255, 0.05) !important;
}
CSSEOF
