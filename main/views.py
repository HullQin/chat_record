from django.shortcuts import render, redirect
from django.views.decorators.http import require_GET
from django.http import JsonResponse, HttpResponseBadRequest
from django.conf import settings
from django.db.models import Q
from main.memcache import memcache_get
from main.models import Room, get_record_model
from sts.sts import Sts
import requests
import datetime


def get_sts_credential(allow_prefix):
    config = {
        'url': 'https://sts.tencentcloudapi.com/',
        'domain': 'sts.tencentcloudapi.com',
        'duration_seconds': settings.COS_DURATION_SECONDS,
        'secret_id': settings.COS_SECRET_ID,
        'secret_key': settings.COS_SECRET_KEY,
        'bucket': settings.COS_SECRET_BUCKET,
        'region': settings.COS_SECRET_REGION,
        'allow_prefix': allow_prefix,
        'allow_actions': ['name/cos:GetObject'],
    }
    try:
        sts = Sts(config)
        response = sts.get_credential()
        return response
    except Exception:
        return None


def get_current_user(request):
    session_key = request.COOKIES.get('sid', '')
    if len(session_key) != 32:
        return None
    if settings.DEBUG:
        url = 'https://auth.hullqin.cn/innerapi/user/'
        response = requests.get(url, headers=dict(cookie=f'sid={session_key}'))
        if not response.text:
            return None
        return response.json()
    else:
        result = memcache_get(f':1:django.contrib.sessions.cache{session_key}')
        if result is None:
            return None
        try:
            return result['_auth_user_info']
        except (TypeError, KeyError):
            return None


def get_room_or_reject(request, username=None, room_name=None):
    if username is None:
        username = request.GET.get('username')
        room_name = request.GET.get('room')
    if username is None or room_name is None:
        raise Room.DoesNotExist()
    try:
        room = Room.objects.get(name=room_name, creation_user_id=username)
    except Room.DoesNotExist:
        raise
    if not room.public:
        current_user = get_current_user(request)
        if current_user is None or not room.user_has_permission(current_user['username']):
            raise Room.DoesNotExist()
    return room


def json_response(data, **kwargs):
    return JsonResponse(dict(data=data, **kwargs), json_dumps_params={'ensure_ascii': False})


@require_GET
def index(request):
    return render(request, 'index.html')


@require_GET
def enter_room(request, username, room):
    try:
        get_room_or_reject(request, username, room)
    except Room.DoesNotExist:
        return redirect('/')
    return render(request, 'record.html')


@require_GET
def record(request):
    current = request.GET.get('current')
    need_update_credential = request.GET.get('credential')
    try:
        room = get_room_or_reject(request)
    except Room.DoesNotExist:
        return HttpResponseBadRequest()
    Record = get_record_model(request.GET.get('username'))
    records = Record.objects.filter(room=room)
    if current is None:
        current = records.count()
        persons = [p.to_dict() for p in room.persons.all()]
    else:
        persons = None
        try:
            current = int(current)
        except (ValueError, TypeError):
            return HttpResponseBadRequest()
    if need_update_credential:
        credential = get_sts_credential(allow_prefix=f'{request.GET.get("username")}/{room.name}/*')
    else:
        credential = None
    left = current - 70
    if left < 0:
        left = 0
    records = [r.to_dict() for r in records[left:current]]
    if persons is not None:
        return json_response(records, current=left, persons=persons, credential=credential)
    return json_response(records, current=left, credential=credential)


@require_GET
def search(request):
    date = request.GET.get('date')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    person_id = request.GET.get('person_id')
    keywords = request.GET.getlist('keyword')
    try:
        room = get_room_or_reject(request)
    except Room.DoesNotExist:
        return HttpResponseBadRequest()
    try:
        if date:
            date = datetime.datetime.strptime(date, '%Y-%m-%d')
        else:
            if date_from:
                date_from = datetime.datetime.strptime(date_from, '%Y-%m-%d')
            if date_to:
                date_to = datetime.datetime.strptime(date_to, '%Y-%m-%d')
        if person_id:
            person_id = int(person_id)
    except:
        return HttpResponseBadRequest()
    Record = get_record_model(request.GET.get('username'))
    records = Record.objects.filter(room=room)
    if date is not None:
        records = records.filter(time__gte=date, time__lt=date+datetime.timedelta(hours=24))
    else:
        if date_from is not None:
            records = records.filter(time__gte=date_from)
        if date_to is not None:
            records = records.filter(time__lt=date_to + datetime.timedelta(hours=24))
    if person_id is not None:
        records = records.filter(person_id=person_id)
    if keywords:
        q = Q(content__icontains=keywords[0])
        for keyword in keywords[1:]:
            q = q | Q(content__icontains=keyword)
        records = records.filter(q)
    records = [r.to_dict() for r in records]
    return json_response(records)
