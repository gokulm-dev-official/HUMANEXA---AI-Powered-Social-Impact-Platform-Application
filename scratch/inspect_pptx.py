from pptx import Presentation

def inspect_template(template_path):
    try:
        prs = Presentation(template_path)
        print(f"Number of slides in template: {len(prs.slides)}")
        print("\nAvailable Layouts:")
        for i, layout in enumerate(prs.slide_layouts):
            print(f"Index {i}: {layout.name}")
    except Exception as e:
        print(f"Error reading template: {e}")

if __name__ == "__main__":
    template_path = r"d:\With AI Features\Social_Kind - Copy\Project_report\mini project viva presentation template[1].pptx"
    inspect_template(template_path)
