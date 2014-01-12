a = !ls *txt
with open(a[0]) as f:
    a = '\n'.join(f.readlines())
a[:100]
b = [x for _, x, _, _ in a]
b = [x[1] for x in a]
import json
b = json.loads(a)
b[:5]
dates = [x[1] for x in b]
dates[:5]
import datetime as dt
datetime.strptime(dates[0])
import datetime
datetime.strptime(dates[0])
datetime.datetime.strptime(dates[0])
datetime.datetime.strptime(dates[0], '%d %B %Y')
dates[0]
dts = [datetime.datetime.strptime(d, '%d %B %Y') for d in dates]
dts[:1]
datetime.datetime.strptime('3 August 1980', '%d %B %Y')
