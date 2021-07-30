from django.urls import path
from main import views

urlpatterns = [
    path('api/record/', views.record, name='record_list'),
    path('<str:username>/<str:room>/', views.enter_room, name='enter_room'),
]
