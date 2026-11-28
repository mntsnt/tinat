import os
from PIL import Image

base_dir = r"C:\Users\hp\Desktop\Tinat Project\Tinat\app\public\assets\academy"

print("Starting image optimization...")
initial_total = 0
final_total = 0

for root, dirs, files in os.walk(base_dir):
    for f in files:
        if not f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            continue
        
        filepath = os.path.join(root, f)
        old_size = os.path.getsize(filepath)
        initial_total += old_size
        
        with Image.open(filepath) as img:
            orig_w, orig_h = img.size
            img_format = img.format
            img_mode = img.mode
            
            # Determine max width based on folder
            rel = os.path.relpath(filepath, base_dir)
            if "modules" in rel:
                max_w = 1000  # Course cards are ~360px wide, 1000px gives ultra-sharp 2.5x Retina
            elif "diagrams" in rel:
                max_w = 1400  # Reading container is max ~750px, 1400px gives crystal clear text
            else:
                max_w = 1200
            
            if orig_w > max_w:
                ratio = max_w / float(orig_w)
                new_h = int(round(orig_h * ratio))
                resample = getattr(Image, "Resampling", Image).LANCZOS
                resized = img.resize((max_w, new_h), resample=resample)
            else:
                resized = img.copy()
            
            # Convert RGBA to RGB if saving as JPEG
            target_format = "JPEG" if (img_format == "JPEG" or filepath.lower().endswith((".jpg", ".jpeg"))) else img_format
            if target_format == "JPEG" and resized.mode in ("RGBA", "P"):
                resized = resized.convert("RGB")
            
            # Save optimized
            temp_path = filepath + ".tmp"
            if target_format == "JPEG":
                resized.save(temp_path, format="JPEG", quality=82, optimize=True, progressive=True)
            elif target_format == "PNG":
                resized.save(temp_path, format="PNG", optimize=True)
            else:
                resized.save(temp_path, quality=82)
                
        # Replace original
        os.replace(temp_path, filepath)
        new_size = os.path.getsize(filepath)
        final_total += new_size
        
        savings = (1 - (new_size / old_size)) * 100
        print(f"✓ {rel}: {orig_w}x{orig_h} ({old_size/1024:.0f} KB) -> {resized.size[0]}x{resized.size[1]} ({new_size/1024:.0f} KB) [-{savings:.1f}%]")

print(f"\n==========================================")
print(f"INITIAL TOTAL: {initial_total / (1024*1024):.2f} MB")
print(f"OPTIMIZED TOTAL: {final_total / (1024*1024):.2f} MB")
print(f"NET REDUCTION: {((initial_total - final_total) / initial_total)*100:.1f}%")
print(f"==========================================")
