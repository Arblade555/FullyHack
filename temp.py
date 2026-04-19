from humandelta import HumanDelta
import os
from dotenv import load_dotenv

load_dotenv()

hd = HumanDelta(api_key=os.getenv('HUMANDELTA_API'))

job = hd.indexes.create(
    "https://en.wikipedia.org/wiki/Deep_sea",
    name="Deep Sea Wikipedia"
)

print(job.id, job.status)