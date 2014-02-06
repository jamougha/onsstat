
DROP TABLE columndata;

DROP TABLE datasets;

DROP TABLE cdids;


DROP TABLE reduced_columns;


CREATE TABLE cdids
(
  cdid character(4) NOT NULL,
  price character varying(16),
  seasonal_adjustment character varying(16),
  name text,
  CONSTRAINT cdids_pkey PRIMARY KEY (cdid)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE cdids
  OWNER TO holdem;

  
CREATE TABLE datasets
(
  id integer NOT NULL,
  title text NOT NULL,
  CONSTRAINT datasets_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE datasets
  OWNER TO holdem;
 
 
CREATE TABLE columndata
(
  cdid character(4) NOT NULL,
  dataset_id integer NOT NULL,
  base_period character varying(16),
  index_period character varying(16),
  "column" text NOT NULL,
  CONSTRAINT datacolumn_pkey PRIMARY KEY (cdid, dataset_id),
  CONSTRAINT datacolumn_dataset_id_fkey FOREIGN KEY (dataset_id)
      REFERENCES datasets (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
  OIDS=FALSE
);
ALTER TABLE columndata
  OWNER TO holdem;


CREATE TABLE reduced_columns
(
  cdid character(4),
  datasets integer[],
  id serial NOT NULL,
  datacolumn text,
  CONSTRAINT id PRIMARY KEY (id),
  CONSTRAINT reduced_columns_cdid_fkey FOREIGN KEY (cdid)
      REFERENCES cdids (cdid) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
  OIDS=FALSE
);
ALTER TABLE reduced_columns
  OWNER TO holdem;
