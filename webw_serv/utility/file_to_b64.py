from base64 import b64encode, b64decode

def file_to_b64(file_path):
    with open(file_path, "rb") as f:
        return b64encode(f.read()).decode()

def b64_to_file(b64_str, file_path):
    with open(file_path, "wb") as f:
        f.write(b64decode(b64_str))
