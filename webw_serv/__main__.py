import sys
from webw_serv.main import main
from webw_serv import CONFIG
import os
import asyncio
#from webw_serv.watcher.manager import manager_main
from webw_serv.watcher.script_checker import script_checker

if __name__ == "__main__":
    # print(script_checker("http_return"))
    # manager_main()
    os.makedirs(CONFIG.STORE_PATH, exist_ok=True)
    os.makedirs(CONFIG.SCRIPTS_PATH, exist_ok=True)
    os.makedirs(CONFIG.SCRIPTS_TEMP_PATH, exist_ok=True)
    sys.path.append(CONFIG.STORE_PATH)
    asyncio.run(main())