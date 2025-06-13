from celery import Celery
from celery.schedules import crontab
import os

app.conf.beat_schedule = {
    'send-emi-payment-reminders': {
        'task': 'notifications.tasks.send_emi_payment_reminders',
        'schedule': crontab(hour=10, minute=0),  # Run daily at 10 AM
    },
    'send-emi-overdue-notifications': {
        'task': 'notifications.tasks.send_emi_overdue_notifications',
        'schedule': crontab(hour=14, minute=0),  # Run daily at 2 PM
    },
    'retry-failed-notifications': {
        'task': 'notifications.tasks.retry_failed_notifications',
        'schedule': crontab(minute='*/30'),  # Run every 30 minutes
    },
} 