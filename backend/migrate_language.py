"""Add language column to patients table if it doesn't already exist."""
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE patients ADD COLUMN language VARCHAR(10) NOT NULL DEFAULT 'en'"))
        conn.commit()
        print("Added 'language' column to patients table.")
    except Exception as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            print("Column 'language' already exists — skipping.")
        else:
            raise
