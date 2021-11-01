FROM python:3.9
MAINTAINER hullqin
COPY . /root/chat_record
WORKDIR /root/chat_record
RUN pip config set global.index-url https://mirrors.cloud.tencent.com/pypi/simple
RUN pip install -r requirements.txt
CMD uwsgi -s /tmp/chat_record/uwsgi.sock --chdir /root/chat_record --wsgi-file /root/chat_record/chat_record/wsgi.py