import os
# pyrefly: ignore [missing-import]
import oracledb
import json
from app.utils.logger import logger

# Global pool reference
pool = None

def init_db_pool():
    """Initializes the cx_Oracle database connection pool."""
    global pool
    try:
        user = os.environ.get('DB_USER')
        password = os.environ.get('DB_PASSWORD')
        dsn = os.environ.get('DB_DSN')
        
        # Oracle Wallet settings can be added here similar to node if needed
        # For thin mode in cx_Oracle, we establish standard pool
        
        pool = oracledb.SessionPool(
            user=user,
            password=password,
            dsn=dsn,
            min=2,
            max=5,
            increment=1,
            getmode=oracledb.SPOOL_ATTRVAL_WAIT
        )
        # logger.info("Oracle oracledb connection pool established.")
    except oracledb.DatabaseError as e:
        logger.error(f"Failed to connect to Oracle DB: {str(e)}")
        # We don't crash here so Flask can still boot and serve health checks, 
        # but actual DB dependent endpoints will fail until resolved.

def get_connection():
    """Retrieves a connection from the pool."""
    if not pool:
        # logger.warning("DB Pool is not initialized, attempting to re-initialize...")
        init_db_pool()
        if not pool:
           raise Exception("Database connection pool is offline.")
           
    return pool.acquire()

def release_connection(connection):
    """Releases a connection back to the pool."""
    if pool and connection:
        pool.release(connection)

def fetch_all_student_encodings():
    """
    Fetches all active students and their Face Encodings from the Database.
    Returns: A list of dicts: [{'student_id': 1000, 'name': 'Ali', 'encoding': [128 floats]}]
    """
    conn = None
    students_data = []
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # We need the Student_ID, Name, and Face_Encoding which is a CLOB containing a JSON array
        sql = """
            SELECT Student_ID, Name, Face_Encoding 
            FROM STUDENTS 
            WHERE Is_Active = 'Y' AND Face_Encoding IS NOT NULL
        """
        cursor.execute(sql)
        
        for row in cursor:
            student_id = row[0]
            name = row[1]
            encoding_clob = row[2]
            
            # Read CLOB and parse JSON to a Python List
            encoding_json = encoding_clob.read()
            try:
                encoding_list = json.loads(encoding_json)
                students_data.append({
                    'student_id': student_id,
                    'name': name,
                    'encoding': encoding_list
                })
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON encoding for student {student_id}: {str(e)}")
                
        cursor.close()
        return students_data
        
    except Exception as e:
        logger.error(f"Database error fetching encodings: {str(e)}")
        raise
    finally:
        if conn:
            release_connection(conn)

def save_student_encoding(student_id, encoding_list, image_path=None):
    """
    Saves a newly registered 128-float face encoding back to the database.
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        encoding_json = json.dumps(encoding_list)
        
        sql = """
            UPDATE STUDENTS 
            SET Face_Encoding = :encoding, Image_Path = :image_path
            WHERE Student_ID = :student_id
        """
        
        cursor.execute(sql, {
            'encoding': encoding_json,
            'image_path': image_path,
            'student_id': student_id
        })
        conn.commit()
        cursor.close()
        return True
    except Exception as e:
        logger.error(f"Error saving encoding for student {student_id}: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            release_connection(conn)
