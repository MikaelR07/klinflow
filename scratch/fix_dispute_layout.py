import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/DisputesPage.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# We need to wrap ROW 1, ROW 2, and the Left Column inside a single lg:col-span-3 column,
# and move the grid definition to wrap all of them, alongside the Right Column.

# Find the start of ROW 1
row1_start = content.find('{/* ROW 1: KPI CARDS */}')
# Find the end of the Left Column (which is right before Right Column)
right_col_start = content.find('{/* Right Column (Span 1) */}')

if row1_start != -1 and right_col_start != -1:
    before_grid = content[:row1_start]
    
    # We need to extract the Left Column content and remove the <div className="grid grid-cols-1 lg:grid-cols-4 gap-6"> wrapper
    # The existing code has:
    # {/* ROW 3 & 4: TABLES & SIDEBAR */}
    # <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    #   {/* Left Column (Span 3) */}
    #   <div className="lg:col-span-3 space-y-6">
    
    # First, let's just use regex to extract the main pieces.
    
    # Extract ROW 1:
    row1_match = re.search(r'\{\/\* ROW 1: KPI CARDS \*\/\}.*?(?=\{\/\* ROW 2: ANALYSIS CARDS \*\/\})', content, re.DOTALL)
    row2_match = re.search(r'\{\/\* ROW 2: ANALYSIS CARDS \*\/\}.*?(?=\{\/\* ROW 3 & 4: TABLES & SIDEBAR \*\/\})', content, re.DOTALL)
    
    # For Row 2, the grid is `grid-cols-1 lg:grid-cols-3`. We might want to keep it or change it to `grid-cols-1 lg:grid-cols-2` because it's now inside a span-3 container instead of full width.
    # The area chart is `lg:col-span-2` currently. If we change row 2 to `grid grid-cols-1 lg:grid-cols-5`, we can keep exact proportions. But let's leave it as is for now, tailwind handles nested grids well.
    
    left_col_match = re.search(r'\{\/\* Left Column \(Span 3\) \*\/\}\s*<div className="lg:col-span-3 space-y-6">\s*(.*?)\s*</div>\s*\{\/\* Right Column \(Span 1\) \*\/\}', content, re.DOTALL)
    
    right_col_match = re.search(r'\{\/\* Right Column \(Span 1\) \*\/\}.*?(?=\{\/\* RESOLUTION MODAL \*\/\})', content, re.DOTALL)
    
    if row1_match and row2_match and left_col_match and right_col_match:
        row1_content = row1_match.group(0)
        row2_content = row2_match.group(0)
        left_col_inner = left_col_match.group(1)
        right_col_content = right_col_match.group(0)
        
        # Adjust Row 2 grid to fit better in the narrower space
        # Original: <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        # Let's change it to: <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        new_layout = f"""<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {{/* LEFT MAIN COLUMN */}}
        <div className="lg:col-span-3 space-y-6">
          {row1_content}
          
          {row2_content}
          
          {{/* ROW 3 & 4: TABLES */}}
          <div className="space-y-6">
            {left_col_inner}
          </div>
        </div>

        {right_col_content}
      </div>

      {{/* RESOLUTION MODAL */}}"""
        
        # Replace everything from ROW 1 to RESOLUTION MODAL
        pattern = re.compile(r'\{\/\*\s*ROW 1: KPI CARDS\s*\*\/\}.*?(?=\{\/\*\s*RESOLUTION MODAL\s*\*\/\})', re.DOTALL)
        new_content = pattern.sub(new_layout, content)
        
        with open(filepath, 'w') as f:
            f.write(new_content)
        print("Updated layout to place right sidebar starting from top.")
    else:
        print("Regex matching failed, check the markers.")
else:
    print("Markers not found.")
