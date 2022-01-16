from main.json_serde import json_serde
from pymemcache import Client, MemcacheUnexpectedCloseError, MemcacheError


class MemcacheClient:
    def __init__(self):
        self.client = None
        self._connect()

    def _connect(self):
        self.client = Client('192.168.0.1', serde=json_serde, connect_timeout=10, timeout=10)

    def get(self, key):
        try:
            return self.client.get(key)
        except MemcacheUnexpectedCloseError:
            self._connect()
        except MemcacheError:
            pass
        return None


memcache_get = MemcacheClient().get
