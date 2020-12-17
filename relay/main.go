package main

import (
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/jmoiron/sqlx"
	"github.com/kelseyhightower/envconfig"
	"github.com/rs/cors"
	"github.com/rs/zerolog"
)

type Settings struct {
	Host string `envconfig:"HOST" default:"0.0.0.0"`
	Port string `envconfig:"PORT" default:"7447"`

	PostgresDatabase string `envconfig:"POSTGRESQL_DATABASE"`
	SQLiteDatabase   string `envconfig:"SQLITE_DATABASE"`
}

var s Settings
var err error
var db *sqlx.DB
var log = zerolog.New(os.Stderr).Output(zerolog.ConsoleWriter{Out: os.Stderr})
var router = mux.NewRouter()

func main() {
	err = envconfig.Process("", &s)
	if err != nil {
		log.Fatal().Err(err).Msg("couldn't process envconfig")
	}

	db, err = initDB()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to open database")
	}

	// NIP01
	router.Path("/listen_events").Methods("GET").HandlerFunc(listenEvents)
	router.Path("/save_event").Methods("POST").HandlerFunc(saveEvent)
	router.Path("/request_feed").Methods("POST").HandlerFunc(requestFeed)
	router.Path("/request_watch").Methods("POST").HandlerFunc(requestWatchKeys)
	router.Path("/request_unwatch").Methods("POST").HandlerFunc(requestUnwatchKeys)
	router.Path("/request_user").Methods("POST").HandlerFunc(requestUser)
	router.Path("/request_event").Methods("POST").HandlerFunc(requestEvent)

	// extra?
	router.Path("/query_users").Methods("GET").HandlerFunc(queryUsers)

	srv := &http.Server{
		Handler:      cors.Default().Handler(router),
		Addr:         s.Host + ":" + s.Port,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Debug().Str("addr", srv.Addr).Msg("listening")
	srv.ListenAndServe()
}
