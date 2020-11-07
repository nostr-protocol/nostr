// +build !postgres !sqlite

package main

import (
	_ "github.com/cznic/ql/driver"
	"github.com/jmoiron/sqlx"
)

func initDB() (*sqlx.DB, error) {
	return sqlx.Connect("ql2", s.QLDatabase)
}
