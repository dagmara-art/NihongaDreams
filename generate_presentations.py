import json
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def create_presentation(original_path, bg_path, out_path):
    bg = Image.open(bg_path).convert("RGBA")
    try:
        img = Image.open(original_path).convert("RGBA")
    except Exception as e:
        print(f"Could not open {original_path}: {e}")
        return False

    # Scale image to fit within 800x800
    max_size = 800
    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    img_w, img_h = img.size

    # Calculate position (centered horizontally, slightly above center vertically)
    x = (1080 - img_w) // 2
    y = (1350 - img_h) // 2 - 20

    # Create shadow
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    
    # STRONGER SHADOW SETTINGS
    shadow_offset_x = 35
    shadow_offset_y = 35
    shadow_box = [x + shadow_offset_x, y + shadow_offset_y, x + img_w + shadow_offset_x, y + img_h + shadow_offset_y]
    shadow_draw.rectangle(shadow_box, fill=(0, 0, 0, 180))
    
    # Blur shadow
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=35))

    # Composite shadow onto background
    bg = Image.alpha_composite(bg, shadow)

    # Paste image
    bg.paste(img, (x, y), img)

    # Add copyright text
    try:
        font = ImageFont.truetype("Helvetica", 24)
    except:
        font = ImageFont.load_default()
    
    text = "© Dagmara Okła 2026"
    
    # Create a temporary image to draw the text
    dummy_img = Image.new("RGBA", (1, 1), (0, 0, 0, 0))
    dummy_draw = ImageDraw.Draw(dummy_img)
    bbox = dummy_draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    # Create an image for the text with some padding
    txt_img = Image.new("RGBA", (text_w + 10, text_h + 10), (255, 255, 255, 0))
    txt_draw = ImageDraw.Draw(txt_img)
    # Draw text
    txt_draw.text((5, 5), text, fill=(70, 70, 70, 255), font=font)
    
    # Rotate text 90 degrees counter-clockwise (reads upwards)
    txt_img = txt_img.rotate(90, expand=True)
    
    # Paste the text image onto the background
    paste_x = 1035
    paste_y = 1310 - txt_img.height
    
    bg.paste(txt_img, (paste_x, paste_y), txt_img)

    # Save as WebP
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bg.convert("RGB").save(out_path, "WEBP", quality=90)
    return True

def main():
    json_path = "Data/artworks.json"
    bg_path = "temp/tlo.png"
    
    with open(json_path, 'r', encoding='utf-8') as f:
        artworks = json.load(f)
        
    for art in artworks:
        filename = art.get("filename")
        if not filename:
            continue
            
        original_path = f"Data/Lightbox_new/Original/{filename}.webp"
        out_path = f"Data/Lightbox_new/Presentation/{filename}.webp"
        
        if os.path.exists(original_path):
            print(f"Generating presentation for {filename}...")
            success = create_presentation(original_path, bg_path, out_path)
            if success:
                art["presentationFilename"] = filename
        else:
            print(f"Original not found for {filename}, skipping.")

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(artworks, f, indent=2, ensure_ascii=False)
        
    print("Done generating images and updating artworks.json.")

if __name__ == "__main__":
    main()
