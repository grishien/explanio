#!/usr/bin/env python3
"""
Simple script to generate placeholder icons for the Chrome extension.
Run this script to create icon16.png, icon48.png, and icon128.png
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    
    def create_icon(size):
        # Create a green square with white "CE" text
        img = Image.new('RGB', (size, size), (76, 175, 80))
        draw = ImageDraw.Draw(img)
        
        # Try to use a font, fallback to default if not available
        try:
            font_size = int(size * 0.5)
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        # Draw "CE" text in white
        text = "CE"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        position = ((size - text_width) // 2, (size - text_height) // 2)
        
        draw.text(position, text, fill=(255, 255, 255), font=font)
        return img
    
    # Generate icons
    for size in [16, 48, 128]:
        icon = create_icon(size)
        icon.save(f'icon{size}.png')
        print(f'Created icon{size}.png')
    
    print('All icons generated successfully!')
    
except ImportError:
    print("PIL (Pillow) is not installed. Creating simple colored squares...")
    # Fallback: create simple colored squares using basic approach
    import struct
    
    def create_simple_icon(size):
        # Create a simple green PNG
        pixels = []
        green = (76, 175, 80)
        for y in range(size):
            for x in range(size):
                pixels.append(struct.pack('BBB', green[0], green[1], green[2]))
        
        # This is a simplified approach - for actual PNG creation, PIL is recommended
        print(f"Note: icon{size}.png needs to be created manually or with PIL")
    
    for size in [16, 48, 128]:
        create_simple_icon(size)
    
    print("\nTo generate proper icons, install Pillow:")
    print("  pip install Pillow")
    print("Then run this script again.")

