from base64 import b64encode, b64decode

def file_to_b64(file_path):
    with open(file_path, "rb") as f:
        return b64encode(f.read()).decode()

def b64_to_file(b64_str, file_path):
    b64_str = b64_str.split(",")[-1]
    with open(file_path, "wb") as f:
        f.write(b64decode(b64_str))

if __name__ == "__main__":
    print(file_to_b64("/webw_serv_scripts_store/scripts/http_return.py"))