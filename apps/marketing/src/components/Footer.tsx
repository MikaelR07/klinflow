import { Link } from "react-router-dom";
import { Leaf, Globe, Mail, MessageSquare } from "lucide-react";

export default function Footer() {
  const sections = [
    {
      title: "Resources",
      links: [
        { name: "Klin Api", path: "/ecosystem" },
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
      className="py-10 md:py-16 px-6 transition-colors relative z-20 bg-surface-900 text-slate-200"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-8 mb-10">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tighter text-slate-200">
                Klinflow
              </span>
            </Link>
            <p className="text-sm sm:text-base font-medium leading-relaxed max-w-sm italic mb-5 text-slate-200">
             Powering the digital transformation of the recycling industry through connected technology, intelligent operations, and seamless collaboration.
            </p>
            <div className="flex items-center gap-6">
              <Globe className="w-5 h-5 transition-all cursor-pointer text-slate-100 hover:text-primary" />
              <Mail className="w-5 h-5 transition-all cursor-pointer text-slate-100 hover:text-primary" />
              <MessageSquare className="w-5 h-5 transition-all cursor-pointer text-slate-100 hover:text-primary" />
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title} className="col-span-1">
              <h5 className="text-xs font-bold uppercase tracking-[0.2em] mb-5 text-slate-200">
                {section.title}
              </h5>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm font-bold transition-colors text-slate-200 hover:text-primary"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-200 italic text-center md:text-left w-full md:w-auto mb-4 md:mb-0">
            © 2026 Klinflow . All Rights Reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-200">
            <span className="cursor-pointer hover:text-primary transition-colors">
              Security
            </span>
            <span className="cursor-pointer hover:text-primary transition-colors">
              Privacy Policy
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
