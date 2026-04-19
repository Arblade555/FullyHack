from humandelta import HumanDelta
import os
from dotenv import load_dotenv

load_dotenv()

hd = HumanDelta(api_key=os.getenv('HUMANDELTA_API'))

def search(query):
    results = hd.search(query)
    return "\n".join([r.text for r in results])