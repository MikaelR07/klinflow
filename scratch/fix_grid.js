const fs = require('fs');
let file = fs.readFileSync('apps/agent/src/pages/admin/MarketIntelligence.tsx', 'utf8');

// The Table Card has to be closed BEFORE Bottom Section
if (file.includes('              </div>\n\n            {/* BOTTOM SECTION */}')) {
  file = file.replace('              </div>\n\n            {/* BOTTOM SECTION */}', '              </div>\n            </div>\n\n            {/* BOTTOM SECTION */}');
}

// The Main Column has to be closed BEFORE Sidebar
if (file.includes('            </div>\n          </div>\n\n          {/* SIDEBAR (RIGHT) */}')) {
  file = file.replace('            </div>\n          </div>\n\n          {/* SIDEBAR (RIGHT) */}', '            </div>\n\n          </div>\n\n          {/* SIDEBAR (RIGHT) */}');
} else if (file.includes('            </div>\n\n          {/* SIDEBAR (RIGHT) */}')) {
  // If we only have one closing div
  file = file.replace('            </div>\n\n          {/* SIDEBAR (RIGHT) */}', '            </div>\n          </div>\n\n          {/* SIDEBAR (RIGHT) */}');
}

fs.writeFileSync('apps/agent/src/pages/admin/MarketIntelligence.tsx', file);
