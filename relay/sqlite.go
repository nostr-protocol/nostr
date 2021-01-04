// +build !full

package main

import (
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

func initDB() (*sqlx.DB, error) {
	db, err := sqlx.Connect("sqlite3", s.SQLiteDatabase)
	if err != nil {
		return nil, err
	}

	_, err = db.Exec(`
CREATE TABLE event (
  id text NOT NULL,
  pubkey text NOT NULL,
  created_at integer NOT NULL,
  kind integer NOT NULL,
  tags text NOT NULL,
  content text NOT NULL,
  sig text NOT NULL
);

CREATE UNIQUE INDEX ididx ON event (id);
CREATE INDEX pubkeytimeidx ON event (pubkey, created_at);
    `)
	return db, nil
}
