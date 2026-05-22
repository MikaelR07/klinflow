import { Link } from "react-router-dom";
import { Leaf, Globe, Mail, MessageSquare } from "lucide-react";
import { useThemeStore } from "@klinflow/core/stores/themeStore";

export default function Footer() {
  const { isDarkMode } = useThemeStore();

  const sections = [
    {
      title: "Products",
      links: [
        { name: "For Residents", path: "/for-residents" },
        { name: "For Agents", path: "/for-agents" },
        { name: "Fleet Management", path: "/products/fleet" },
        { name: "Hub Operations", path: "/products/hub" },
        { name: "Marketplace", path: "/marketplace" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "How It Works", path: "/system" },
        { name: "Ecosystem Map", path: "/ecosystem" },
        // { name: "Pricing Model", path: "/pricing" },
        // { name: "Documentation", path: "/docs" },
      ],
    },
    // {
    //   title: "Company",
    //   links: [
    //     { name: "About Us", path: "/about" },
    //     { name: "Contact Sales", path: "/contact" },
    //     { name: "Vision", path: "/vision" },
    //     { name: "Careers", path: "/careers" },
    //   ],
    // },
  ];

  return (
    <footer
      className={`py-16 md:py-32 px-6 border-t transition-colors relative z-20 ${isDarkMode ? "border-white/5 bg-surface-950 text-white" : "border-slate-200 bg-white text-slate-900"}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span
                className={`text-2xl font-bold tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Klinflow
              </span>
            </Link>
            <p
              className={`font-medium leading-relaxed max-w-sm italic mb-8 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
            >
              The financial engine for the circular economy. Transforming
              Africa's waste management into a high-yield digital asset
              ecosystem.
            </p>
            <div className="flex items-center gap-6">
              <Globe
                className={`w-5 h-5 transition-all cursor-pointer ${isDarkMode ? "text-slate-300 hover:text-primary" : "text-slate-500 hover:text-primary"}`}
              />
              <Mail
                className={`w-5 h-5 transition-all cursor-pointer ${isDarkMode ? "text-slate-300 hover:text-primary" : "text-slate-500 hover:text-primary"}`}
              />
              <MessageSquare
                className={`w-5 h-5 transition-all cursor-pointer ${isDarkMode ? "text-slate-300 hover:text-primary" : "text-slate-500 hover:text-primary"}`}
              />
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h5
                className={`text-xs font-bold uppercase tracking-[0.2em] mb-8 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                {section.title}
              </h5>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className={`text-sm font-bold transition-colors ${isDarkMode ? "text-slate-400 hover:text-primary" : "text-slate-500 hover:text-primary"}`}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 italic">
            © 2026 Klinflow . All Rights Reserved.
          </p>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="cursor-pointer hover:text-primary transition-colors">
              Security
            </span>
            <span className="cursor-pointer hover:text-primary transition-colors">
              Privacy Policy
            </span>
            {/* <div className="flex items-center gap-2">
              <span className="hover:text-primary transition-colors cursor-pointer">
                System: Operational
              </span>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
