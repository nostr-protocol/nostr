CREATE TABLE event (
  pubkey text NOT NULL,
  time integer NOT NULL,
  kind integer NOT NULL,
  content text NOT NULL,
  signature text NOT NULL
)

CREATE INDEX pubkeytime ON event (pubkey, time);
