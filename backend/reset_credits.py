from app.database import SessionLocal
from app.models import Patient

db = SessionLocal()
db.query(Patient).update({"chat_credits": 9999})
db.commit()
print("Chat credits reset to 9999 for all patients")
db.close()
