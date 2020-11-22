package main

import (
	"encoding/json"
	"net/http"
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

func listenEvents(w http.ResponseWriter, r *http.Request) {
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
}

func watchPubKeys(keys []string, es *eventsource.EventSource) {
	wlock.Lock()
	defer wlock.Unlock()

	currentKeys, _ := backwatchers[es]
	backwatchers[es] = append(currentKeys, keys...)

	for _, key := range keys {
		if ess, ok := watchers[key]; ok {
			watchers[key] = append(ess, es)
		} else {
			watchers[key] = []*eventsource.EventSource{es}
		}
	}
}

func unwatchPubKeys(excludedKeys []string, es *eventsource.EventSource) {
	wlock.Lock()
	defer wlock.Unlock()

	for _, key := range excludedKeys {
		if ess, ok := watchers[key]; ok {
			newEss := make([]*eventsource.EventSource, len(ess)-1)

			var i = 0
			for _, existingEs := range ess {
				if existingEs == es {
					continue
				}
				newEss[i] = existingEs
				i++
			}

			watchers[key] = newEss
		}
	}

	currentKeys, _ := backwatchers[es]
	newKeys := make([]string, 0, len(currentKeys))
	for _, currentKey := range currentKeys {
		if inArray(excludedKeys, currentKey) {
			continue
		}
		newKeys = append(newKeys, currentKey)
	}

	backwatchers[es] = newKeys
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
			(*es).SendEventMessage(string(jevent), "n", "")
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
