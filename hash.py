import hashlib

def create_fingerprint(image_path):
    with open(image_path, "rb") as image_file:
        image_data = image_file.read()
    return hashlib.sha256(image_data).hexdigest()

fingerprint = create_fingerprint("path/to/your/image.jpg")
