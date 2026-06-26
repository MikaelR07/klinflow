with open('apps/hub/src/pages/ExecutiveCommandCenter.tsx', 'r') as f:
    content = f.read()

lines = content.split('\n')
div_stack = []

for i, line in enumerate(lines):
    # This is a very naive parsing just to get a general idea
    # Find all <div and </div>
    idx = 0
    while idx < len(line):
        open_idx = line.find('<div', idx)
        close_idx = line.find('</div', idx)
        
        if open_idx != -1 and (close_idx == -1 or open_idx < close_idx):
            div_stack.append(i + 1)
            idx = open_idx + 4
        elif close_idx != -1:
            if div_stack:
                div_stack.pop()
            else:
                print(f"Error: Unmatched </div> at line {i + 1}")
            idx = close_idx + 5
        else:
            break

if div_stack:
    print("Error: Unclosed <div at lines:", div_stack)
else:
    print("All divs are matched!")
