with open("SellerHome.tsx", "r") as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
insert_idx = -1

for i, line in enumerate(lines):
    if "{/* ── HUSTLE ACTION CENTER (TRIO CONTROLS) ── */}" in line:
        start_idx = i
    if "{/* End space-y-3 */}" in line:
        end_idx = i
    if "{/* ── MARKET INTELLIGENCE (NEW OS LAYER) ── */}" in line:
        insert_idx = i

if start_idx != -1 and end_idx != -1 and insert_idx != -1:
    block = lines[start_idx:end_idx]
    # Remove block from original location
    del lines[start_idx:end_idx]
    
    # We must adjust insert_idx if we deleted lines before it, but start_idx > insert_idx
    # Since start_idx > insert_idx, the insert_idx remains the same!
    lines = lines[:insert_idx] + block + lines[insert_idx:]
    
    with open("SellerHome.tsx", "w") as f:
        f.writelines(lines)
    print("Block moved successfully")
else:
    print(f"Failed to find indices: {start_idx}, {end_idx}, {insert_idx}")
