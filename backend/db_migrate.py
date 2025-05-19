import sqlite3
import os
from pathlib import Path

# Get the database file path
DB_PATH = "music_social.db"
if os.path.exists(DB_PATH):
    print(f"Found database at {DB_PATH}")
else:
    # Check in backend dir
    backend_db_path = os.path.join("backend", DB_PATH)
    if os.path.exists(backend_db_path):
        DB_PATH = backend_db_path
        print(f"Found database at {DB_PATH}")
    else:
        print(f"Database not found at {DB_PATH} or {backend_db_path}")
        exit(1)

# Connect to the database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check if file_path column exists
cursor.execute("PRAGMA table_info(music_preferences)")
columns = cursor.fetchall()
column_names = [col[1] for col in columns]

if "file_path" not in column_names:
    print("Adding file_path column to music_preferences table...")
    cursor.execute("ALTER TABLE music_preferences ADD COLUMN file_path TEXT")
    conn.commit()
    print("Column added successfully.")
else:
    print("file_path column already exists.")

# Close the connection
conn.close()
print("Migration completed.") 