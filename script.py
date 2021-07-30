'''
以下是在 manage.py shell 中执行的导入数据的脚本

# 插入聊天记录
for d in data:
    if d is None:
        r = Record(user_id=1, state=2, time=today)
    else:
        i = 1 if d['s'] else 0
        if 'u' in d:
            r = Record(type=2, user_id=i, time=today, content=d['u'])
        else:
            if d['t'] == '此消息已撤回':
                r = Record(user_id=i, state=1, time=today)
            else:
                if len(d['t']) <= 32:
                    r = Record(user_id=i, time=today, text=d['t'])
                else:
                    r = Record(type=1, user_id=i, time=today, text=d['t'][:32], content=d['t'])
    r.save()


# 更新消息日期
for da, li in dates.items():
    d.append([li, datetime.datetime.strptime(da, '%Y年%m月%d日').date()])
d.sort(key=lambda x:x[0])
d.append([0, datetime.date(2020,6,24)])
i = 0
for r in records:
    if i + 1 < len(d) and r.id > d[i+1][0]:
        i += 1
    r.date = d[i][1]
    r.save(update_fields=['date'])


# 替换为图片id
for r in Record.objects.all():
    if r.type == 2:
        c = r.content
        r.content = c.replace('https://internal-api-lark-file.feishu.cn/api/image/keys/', '').split('?message_id=')[0]
        r.save(update_fields=['content'])
'''
