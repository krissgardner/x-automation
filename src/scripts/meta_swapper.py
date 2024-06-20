from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import random
import string
import json

def generate_random_metadata():
    metadata = {
        "title": ''.join(random.choices(string.ascii_uppercase + string.digits, k=10)),
        "description": ''.join(random.choices(string.ascii_uppercase + string.digits + string.whitespace, k=50)),
        "author": ''.join(random.choices(string.ascii_uppercase + string.digits, k=8)),
        "date": f"{random.randint(2000, 2023)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
        "tags": [ ''.join(random.choices(string.ascii_uppercase + string.digits, k=5)) for _ in range(random.randint(1, 10)) ]
    }
    return metadata

def manipulate_image(image_path, output_path):
    with Image.open(image_path) as img:
        ratio = np.round(1.1 + random.randint(0, 19) / 100, 3)
        img = img.resize((img.width // ratio, img.height // ratio))

        # Enhance the image contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(random.randint(110, 200) / 100)

        # Apply a filter to the image
        img = img.filter(ImageFilter.EDGE_ENHANCE)

        # Save the manipulated image
        img.save(output_path)

    # Generate random metadata
    metadata = generate_random_metadata()

    # Save metadata as a JSON file
    metadata_path = output_path.rsplit('.', 1)[0] + '_metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)

    print(f"Image saved to {output_path}")
    print(f"Metadata saved to {metadata_path}")
