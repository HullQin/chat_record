import json


class JsonSerde:
    def serialize(self, key, value):
        return json.dumps(value, ensure_ascii=False).encode('utf8'), 0

    def deserialize(self, key, value, flags):
        return json.loads(value)


json_serde = JsonSerde()
