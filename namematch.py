import psycopg2

data = []

def init():
    conn = psycopg2.connect("dbname=onsstat user=holdem password=holdem host=127.0.0.1")
    cur = conn.cursor('foo')
    try:
        cur.execute('select (cdid, name) from cdids')
        data = cur.fetchall()
        print(len(data))
    except Exception as e:
        print(e)
    finally:
        cur.close()
        conn.close()

init()