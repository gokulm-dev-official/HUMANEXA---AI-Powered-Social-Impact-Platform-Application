import os

files_to_merge = [
    "README.md",
    "MASTER_PROJECT_PROMPT.md",
    "CERTIFICATE_QUICK_START.md",
    "DETAILED_FEATURE_PROMPTS.md",
    "CERTIFICATE_VISUAL_GUIDE.md",
    "TIER_VISUAL_COMPARISON.md",
    "ALL_TIERS_COMPLETE.md",
    "CERTIFICATE_IMPLEMENTATION_SUMMARY.md",
    "IMPLEMENTATION_CHECKLIST.md",
    "HONEST_STATUS_REPORT.md",
    "QUICK_REFERENCE_CARD.md"
]

workspace = r"d:\With AI Features\Social_Kind - Copy"

# First, read all contents into memory
merged_content = "# HUMANEXA: COMPLETE STEP-BY-STEP DOCUMENTATION\n\n"
merged_content += "This document is a comprehensive, step-by-step consolidation of all project specifications, implementation guides, and technical details.\n\n---\n\n"

for filename in files_to_merge:
    filepath = os.path.join(workspace, filename)
    if os.path.exists(filepath):
        merged_content += f"\n\n<!-- BEGIN {filename} -->\n\n"
        if filename != "README.md":
            merged_content += f"# {filename.replace('.md', '').replace('_', ' ')}\n\n"
        with open(filepath, "r", encoding="utf-8") as infile:
            merged_content += infile.read()
        merged_content += f"\n\n<!-- END {filename} -->\n\n"
        merged_content += "---\n\n"
    else:
        print(f"Warning: {filename} not found.")

# Delete all old files
for filename in files_to_merge:
    filepath = os.path.join(workspace, filename)
    if os.path.exists(filepath):
        os.remove(filepath)

# Write the final README.md
with open(os.path.join(workspace, "README.md"), "w", encoding="utf-8") as outfile:
    outfile.write(merged_content)

print("Merging complete. Files cleaned up. Output written to README.md")
