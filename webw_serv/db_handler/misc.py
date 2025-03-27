import os

libroot = os.path.dirname(os.path.realpath(__file__))

def read_sql_blocks(file_path):
    with open(file_path) as f:
        content = f.read()
        if ";" not in content:
            return [content]
        for element in content.split(";"):
            if element.strip() == "":
                continue
            yield element