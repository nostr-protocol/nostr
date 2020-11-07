// +build postgres

package main

import (
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func initDB() (*sqlx.DB, error) {
	return sqlx.Connect("postgres", s.PostgresDatabase)
}
