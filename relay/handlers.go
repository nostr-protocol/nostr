package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"gopkg.in/antage/eventsource.v1"
)

type ErrorResponse struct {
	Error error `json:"error"`
}

func queryUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "application/json")

	keys := r.URL.Query()["keys"]
	found := make(map[string]int, len(keys))
	for _, key := range keys {
		var exists bool
		err := db.Get(&exists, `SELECT true FROM event WHERE pubkey = $1`, key)
		if err != nil {
			w.WriteHeader(500)
			log.Warn().Err(err).Str("key", key).Msg("failed to check existence")
			return
		}
		if exists {
			found[key] = 1
		}
	}
	json.NewEncoder(w).Encode(found)
}

func listenUpdates(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "application/json")

	// will return past items then track changes from these keys:
	keys, _ := r.URL.Query()["key"]

	es := eventsource.New(
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
        SELECT *
        FROM event
        WHERE pubkey IN (`+strings.Join(inkeys, ",")+`)
          AND created_at > $1
        ORDER BY created_at DESC
    `, time.Now().AddDate(0, 0, -5).Unix())
	if err != nil && err != sql.ErrNoRows {
		w.WriteHeader(500)
		log.Warn().Err(err).Interface("keys", keys).Msg("failed to fetch updates")
		return
	}

	for _, evt := range lastUpdates {
		jevent, _ := json.Marshal(evt)
		es.SendEventMessage(string(jevent), "event", "")
	}

	// listen to new events
	watchPubKeys(keys, &es)
}

func saveUpdate(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "application/json")

	var evt Event
	err := json.NewDecoder(r.Body).Decode(&evt)
	if err != nil {
		w.WriteHeader(400)
		log.Warn().Err(err).Msg("couldn't decode body")
		return
	}

	// safety checks
	now := time.Now().UTC().Unix()
	if uint32(now-3600) > evt.CreatedAt || uint32(now+3600) < evt.CreatedAt {
		w.WriteHeader(400)
		log.Warn().Err(err).Time("now", time.Unix(now, 0)).
			Time("event", time.Unix(int64(evt.CreatedAt), 0)).
			Msg("time mismatch")
		return
	}

	// check serialization
	serialized, err := evt.Serialize()
	if err != nil {
		log.Warn().Err(err).Msg("serialization error")
		w.WriteHeader(400)
		return
	}

	// assign ID
	hash := sha256.Sum256(serialized)
	evt.ID = hex.EncodeToString(hash[:])

	// check signature (requires the ID to be set)
	if ok, err := evt.CheckSignature(); err != nil {
		log.Warn().Err(err).Msg("signature verification error")
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(ErrorResponse{err})
		return
	} else if !ok {
		log.Warn().Err(err).Msg("signature invalid")
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(ErrorResponse{errors.New("invalid signature")})
		return
	}

	// insert
	_, err = db.Exec(`
        INSERT INTO event (id, pubkey, created_at, kind, ref, content, sig)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, evt.ID, evt.PubKey, evt.CreatedAt, evt.Kind, evt.Ref, evt.Content, evt.Sig)
	if err != nil {
		log.Warn().Err(err).Str("pubkey", evt.PubKey).Msg("failed to save")
		w.WriteHeader(500)
		return
	}

	w.WriteHeader(201)

	notifyPubKeyEvent(evt.PubKey, &evt)
}
