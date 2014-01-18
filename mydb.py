import psycopg2

_DB_CONNECT_STR = "dbname=onsstat user=holdem password=holdem host=127.0.0.1"
def db_get(query, values=None):
    conn = psycopg2.connect(_DB_CONNECT_STR)
    cur = conn.cursor('foo') # because psycopg2 is ridiculous
    try:
        if values:
            cur.execute(query, values)
        else:
            cur.execute(query)
        return cur.fetchall()
    except Exception as e:
        print(e)
    finally:
        cur.close()
        conn.close()

