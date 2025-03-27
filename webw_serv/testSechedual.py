from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.memory import MemoryJobStore

scheduler = BackgroundScheduler(
    jobstores={
        'default': MemoryJobStore()
    },
    executors={
        'default': {'type': 'threadpool', 'max_workers': 20}
    },
    job_defaults={
        'coalesce': False,
        'max_instances': 3
    }
)


def job_function():
    print("Hello World")


scheduler.start()

scheduler.add_job(job_function, 'interval', seconds=3)

input("Press enter to exit")

scheduler.shutdown()