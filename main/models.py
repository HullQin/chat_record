from django.db import models, connection, utils


def format_datetime(datetime):
    return datetime.strftime('%Y-%m-%d %H:%M:%S') if datetime is not None else None


class User(models.Model):
    username = models.CharField(max_length=12, primary_key=True)


class Room(models.Model):
    public = models.BooleanField(verbose_name='公开', default=False)
    name = models.CharField(verbose_name='房间名', max_length=20)
    creation_time = models.DateTimeField(verbose_name='创建时间', auto_now_add=True)
    creation_user = models.ForeignKey(User, verbose_name='创建者', on_delete=models.PROTECT, related_name='created_rooms')
    accessible_users = models.ManyToManyField(User, verbose_name='可访问用户', blank=True, related_name='accessible_rooms')

    def to_dict(self):
        return {
            'public': self.public,
            'name': self.name,
            'creation_time': format_datetime(self.creation_time),
            'creation_user': self.creation_user_id,
            'accessible_users': [u.username for u in self.accessible_users.all()],
        }

    def user_has_permission(self, username):
        if not username:
            return False
        return self.creation_user_id == username or self.accessible_users.filter(username=username).exists()

    class Meta:
        constraints = [models.UniqueConstraint(fields=['creation_user_id', 'name'], name='unique_room')]


class Person(models.Model):
    image = models.CharField(verbose_name='头像', max_length=256)
    name = models.CharField(verbose_name='名称', max_length=16)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='persons', db_index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'image': self.image,
            'name': self.name,
        }


class Record(models.Model):
    id = models.BigAutoField(primary_key=True)
    room = models.ForeignKey(Room, verbose_name='房间', on_delete=models.CASCADE, related_name='records')
    time = models.DateTimeField(verbose_name='发送时间')
    type = models.SmallIntegerField(verbose_name='消息类型', choices=((0, '文本'), (1, '图片'), (-1, '撤回'), (-2, '丢失')), default=0)
    person = models.ForeignKey(Person, verbose_name='发送者', on_delete=models.CASCADE, related_name='records', blank=True, null=True)
    content = models.CharField(verbose_name='内容', max_length=1024, blank=True)

    def to_dict(self):
        return {
            'time': format_datetime(self.time),
            'type': self.type,
            'person_id': self.person_id,
            'content': self.content,
        }

    class Meta:
        abstract = True
        managed = False
        indexes = [models.Index(fields=['room', 'time'])]
        ordering = ['room', '-time', '-id']


record_models = dict()


def get_record_model(username):
    if username not in record_models:
        class Meta:
            db_table = f'main_record_{username}'
        record_models[username] = type(f'RecordOf{username}', (Record,), dict(Meta=Meta, __module__=__name__))
    return record_models[username]


def record_table_exists(username):
    db_table = f'main_record_{username}'
    with connection.cursor() as cursor:
        cursor.execute(f"select count(*) from sqlite_master where type='table' and name='f{db_table}'")
    return cursor.fetchone()[0] == 1


def create_record_table(username):
    if record_table_exists(username):
        return
    model = get_record_model(username)
    with connection.schema_editor() as schema_editor:
        try:
            schema_editor.create_model(model)
        except utils.OperationalError as e:
            print(e)
