FROM python:3.9
MAINTAINER hullqin
EXPOSE 8887
COPY . /root/chat_record
WORKDIR /root/chat_record
RUN pip config set global.index-url https://mirrors.cloud.tencent.com/pypi/simple
RUN pip install -r requirements.txt
RUN python prod_manage.py migrate
CMD uwsgi --socket 0.0.0.0:8887 --chdir /root/chat_record --wsgi-file /root/chat_record/chat_record/wsgi.py --process 1 --threads 1