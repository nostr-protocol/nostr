// +build sqlite

package main

import (
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

func initDB() (*sqlx.DB, error) {
	return sqlx.Connect("sqlite3", s.SQLITE_DATABASE)
}
