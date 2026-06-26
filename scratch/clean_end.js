const fs = require('fs');

let file = fs.readFileSync('apps/agent/src/pages/admin/MarketIntelligence.tsx', 'utf8');

// Replace the end lines
file = file.replace(
`              </button>
            </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}`,
`              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}`
);

fs.writeFileSync('apps/agent/src/pages/admin/MarketIntelligence.tsx', file);
