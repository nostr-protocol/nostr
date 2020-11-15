package main

import (
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"gopkg.in/antage/eventsource.v1"
)

var sessions = make(map[string]*eventsource.EventSource)
var backsessions = make(map[*eventsource.EventSource]string)
var slock = sync.Mutex{}

var watchers = make(map[string][]*eventsource.EventSource)
var backwatchers = make(map[*eventsource.EventSource][]string)
var wlock = sync.Mutex{}

func listenUpdates(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "application/json")
	var es eventsource.EventSource

	session := r.URL.Query().Get("session")
	if session != "" {
		// if a session id was given, try to recover/save the es object
		slock.Lock()
		preves, ok := sessions[session]
		slock.Unlock()
		if ok {
			// end it here, just serve again the existing object
			es = *preves
			es.ServeHTTP(w, r)
			return
		} else {
			// proceed, but save the es object at the end
			defer func() {
				slock.Lock()
				sessions[session] = &es
				backsessions[&es] = session
				slock.Unlock()
			}()
		}
	}

	// will return past items then track changes from these keys:
	keys, _ := r.URL.Query()["key"]

	es = eventsource.New(
		&eventsource.Settings{
			Timeout:        time.Second * 5,
			CloseOnTimeout: true,
			IdleTimeout:    time.Minute * 5,
			Gzip:           true,
		},
		func(r *http.Request) [][]byte {
			return [][]byte{
				[]byte("X-Accel-Buffering: no"),
				[]byte("Cache-Control: no-cache"),
				[]byte("Content-Type: text/event-stream"),
				[]byte("Connection: keep-alive"),
				[]byte("Access-Control-Allow-Origin: *"),
			}
		},
	)

	go func() {
		time.Sleep(2 * time.Second)
		es.SendRetryMessage(3 * time.Second)
	}()

	go func() {
		for {
			time.Sleep(25 * time.Second)
			if es.ConsumersCount() == 0 {
				removeFromWatchers(&es)
				removeFromSessions(&es)
				es.Close()
				return
			}
			es.SendEventMessage("", "keepalive", "")
		}
	}()

	es.ServeHTTP(w, r)

	// past events
	inkeys := make([]string, 0, len(keys))
	for _, key := range keys {
		// to prevent sql attack here we will check if these keys are valid 33-byte hex
		parsed, err := hex.DecodeString(key)
		if err != nil || len(parsed) != 33 {
			continue
		}
		inkeys = append(inkeys, fmt.Sprintf("'%x'", parsed))
	}
	var lastUpdates []Event
	err := db.Select(&lastUpdates, `
        SELECT *, (SELECT count(*) FROM event AS r WHERE r.ref = event.id) AS rel
        FROM event
        WHERE pubkey IN (`+strings.Join(inkeys, ",")+`)
        ORDER BY created_at DESC
        LIMIT 50
    `)
	if err != nil && err != sql.ErrNoRows {
		w.WriteHeader(500)
		log.Warn().Err(err).Interface("keys", keys).Msg("failed to fetch updates")
		return
	}

	for _, evt := range lastUpdates {
		jevent, _ := json.Marshal(evt)
		es.SendEventMessage(string(jevent), "history", "")
	}

	// listen to new events
	watchPubKeys(keys, &es)
}

func watchPubKeys(keys []string, es *eventsource.EventSource) {
	wlock.Lock()
	defer wlock.Unlock()

	backwatchers[es] = keys

	for _, key := range keys {
		if arr, ok := watchers[key]; ok {
			watchers[key] = append(arr, es)
		} else {
			watchers[key] = []*eventsource.EventSource{es}
		}
	}
}

func removeFromWatchers(es *eventsource.EventSource) {
	wlock.Lock()
	defer wlock.Unlock()

	for _, key := range backwatchers[es] {
		if arr, ok := watchers[key]; ok {
			newarr := make([]*eventsource.EventSource, len(arr)-1)
			i := 0
			for _, oldes := range arr {
				if oldes == es {
					continue
				}
				newarr[i] = oldes
				i++
			}
			watchers[key] = newarr
		}
	}
	delete(backwatchers, es)
}

func notifyPubKeyEvent(key string, evt *Event) {
	wlock.Lock()
	arr, ok := watchers[key]
	wlock.Unlock()

	if ok {
		for _, es := range arr {
			jevent, _ := json.Marshal(evt)
			(*es).SendEventMessage(string(jevent), "happening", "")
		}
	}
}

func grabNamedSession(name string) *eventsource.EventSource {
	slock.Lock()
	es, _ := sessions[name]
	slock.Unlock()
	return es
}

func removeFromSessions(es *eventsource.EventSource) {
	slock.Lock()
	session := backsessions[es]
	delete(backsessions, es)
	delete(sessions, session)
	slock.Unlock()
}
