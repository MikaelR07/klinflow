import re

with open('apps/hub/src/pages/DispatchManagement.tsx', 'r') as f:
    lines = f.readlines()

# Restore the correct `)}` at the end of the file
# Around line 455:
#   ))
# </div>
# Should be:
#   ))
# )}
# </div>

for i in range(len(lines)):
    if lines[i].strip() == '))' and lines[i+1].strip() == '</div>':
        lines.insert(i+1, '                )}\n')
        break

# Remove the extra `)}` near MapContainer if it exists
# We replaced `</LayerGroup>` with `</LayerGroup>\n) : null}`
# So if there's an `)}` right after `) : null}`, we should remove it.
for i in range(len(lines)):
    if ') : null}' in lines[i]:
        if i + 1 < len(lines) and lines[i+1].strip() == ')}':
            lines.pop(i+1)
            break

with open('apps/hub/src/pages/DispatchManagement.tsx', 'w') as f:
    f.writelines(lines)
