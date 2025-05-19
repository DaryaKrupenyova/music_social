import sqlite3
import os

# Check possible database locations
possible_paths = [
    "music_social.db",
    "data/music_social.db"
]

# Try to connect to the database
connected = False

for db_path in possible_paths:
    print(f"Trying database at {db_path}")
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            print(f"Successfully connected to database at {db_path}")
            connected = True
            break
        except Exception as e:
            print(f"Error connecting to {db_path}: {str(e)}")
    else:
        print(f"Database file not found at {db_path}")

if not connected:
    print("Could not connect to any database")
    exit(1)

try:
    # Check if file_path column exists
    cursor.execute("PRAGMA table_info(music_preferences)")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    print(f"Existing columns: {column_names}")

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
except Exception as e:
    print(f"Error during migration: {str(e)}") 