from watcher.scripts.http_return import HTTPStatusReturn
import asyncio

async def test():
    print(await HTTPStatusReturn({"url":"https://google.de"}).run())


if __name__ == "__main__":
    asyncio.run(test())