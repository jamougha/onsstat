A cdid is a reference to a measured quantity. Its price and seasonal adjustment are fixed; its base period and index period are not. A cdid occurs once in a given file.

The data encoded by the cdid is of the form (cdid, datetime) -> value. Datetime may be a year, month or quarter.

Question: does cdid, base, index -> data? Answer: No.

    cdid -> name, price, seasonal_adjustment
    name -> date
    cdid, name -> base_period, index_period, json column data
