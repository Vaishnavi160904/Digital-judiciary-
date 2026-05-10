import random
import datetime

def generate_case_number():
    year = datetime.datetime.now().year
    random_number = random.randint(100000, 999999)
    return f"CNR{year}{random_number}"