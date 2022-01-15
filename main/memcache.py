from pymemcache.client.base import Client
from pymemcache import serde

memcache_client = Client('192.168.0.1', serde=serde.pickle_serde, connect_timeout=10, timeout=10)
