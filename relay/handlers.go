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
)

type ErrorResponse struct {
	Error error `json:"error"`
}

func saveEvent(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "application/json")

	var evt Event
	err := json.NewDecoder(r.Body).Decode(&evt)
	if err != nil {
		w.WriteHeader(400)
		log.Warn().Err(err).Msg("couldn't decode body")
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

	// react to different kinds of events
	switch evt.Kind {
	case 0:
		// delete past set_metadata events from this user
		db.Exec(`DELETE FROM event WHERE pubkey = $1 AND kind = 1`, evt.PubKey)
	case 1:
		// do nothing
	case 2:
		// delete past recommend_server events that match this one
		db.Exec(`DELETE FROM event WHERE pubkey = $1 AND kind = 2 AND content = $2`,
			evt.PubKey, evt.Content)
	}

	// insert
	_, err = db.Exec(`
        INSERT INTO event (id, pubkey, created_at, kind, ref, content, sig)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, evt.ID, evt.PubKey, evt.CreatedAt, evt.Kind, evt.Ref, evt.Content, evt.Sig)
	if err != nil {
		if strings.Index(err.Error(), "UNIQUE") != -1 {
			// already exists
			w.WriteHeader(200)
			return
		}

		log.Warn().Err(err).Str("pubkey", evt.PubKey).Msg("failed to save")
		w.WriteHeader(500)
		return
	}

	w.WriteHeader(201)
	notifyPubKeyEvent(evt.PubKey, &evt)
}

func requestFeed(w http.ResponseWriter, r *http.Request) {
	es := grabNamedSession(r.URL.Query().Get("session"))
	if es == nil {
		w.WriteHeader(400)
		return
	}

	var data struct {
		Limit  int `json:"limit"`
		Offset int `json:"offset"`
	}
	json.NewDecoder(r.Body).Decode(&data)

	if data.Limit <= 0 || data.Limit > 100 {
		data.Limit = 50
	}
	if data.Offset < 0 {
		data.Offset = 0
	} else if data.Offset > 500 {
		return
	}

	keys, ok := backwatchers[es]
	if !ok {
		return
	}

	inkeys := make([]string, 0, len(keys))
	for _, key := range keys {
		// to prevent sql attack here we will check if these keys are valid 32-byte hex
		parsed, err := hex.DecodeString(key)
		if err != nil || len(parsed) != 32 {
			continue
		}
		inkeys = append(inkeys, fmt.Sprintf("'%x'", parsed))
	}
	var lastUpdates []Event
	err := db.Select(&lastUpdates, `
        SELECT *
        FROM event
        WHERE pubkey IN (`+strings.Join(inkeys, ",")+`)
        ORDER BY created_at DESC
        LIMIT $1
        OFFSET $2
    `, data.Limit, data.Offset)
	if err != nil && err != sql.ErrNoRows {
		w.WriteHeader(500)
		log.Warn().Err(err).Interface("keys", keys).Msg("failed to fetch updates")
		return
	}

	for _, evt := range lastUpdates {
		jevent, _ := json.Marshal(evt)
		(*es).SendEventMessage(string(jevent), "p", "")
	}
}

func requestWatchKeys(w http.ResponseWriter, r *http.Request) {
	es := grabNamedSession(r.URL.Query().Get("session"))
	if es == nil {
		w.WriteHeader(400)
		return
	}

	var data struct {
		Keys []string `json:"keys"`
	}
	json.NewDecoder(r.Body).Decode(&data)

	watchPubKeys(data.Keys, es)
}

func requestUnwatchKeys(w http.ResponseWriter, r *http.Request) {
	es := grabNamedSession(r.URL.Query().Get("session"))
	if es == nil {
		w.WriteHeader(400)
		return
	}

	var data struct {
		Keys []string `json:"keys"`
	}
	json.NewDecoder(r.Body).Decode(&data)

	unwatchPubKeys(data.Keys, es)
}

func requestUser(w http.ResponseWriter, r *http.Request) {
	es := grabNamedSession(r.URL.Query().Get("session"))
	if es == nil {
		w.WriteHeader(400)
		return
	}

	var data struct {
		PubKey string `json:"pubkey"`
		Limit  int    `json:"limit"`
		Offset int    `json:"offset"`
	}
	json.NewDecoder(r.Body).Decode(&data)
	if data.PubKey == "" {
		w.WriteHeader(400)
		return
	}
	if data.Limit <= 0 || data.Limit > 100 {
		data.Limit = 30
	}
	if data.Offset < 0 {
		data.Offset = 0
	} else if data.Offset > 300 {
		return
	}

	go func() {
		var metadata Event
		if err := db.Get(&metadata, `
            SELECT * FROM event
            WHERE pubkey = $1 AND kind = 0
        `, data.PubKey); err == nil {
			jevent, _ := json.Marshal(metadata)
			(*es).SendEventMessage(string(jevent), "r", "")
		} else if err != sql.ErrNoRows {
			log.Warn().Err(err).
				Str("key", data.PubKey).
				Msg("error fetching metadata from requested user")
		}
	}()

	go func() {
		var lastUpdates []Event
		if err := db.Select(&lastUpdates, `
            SELECT * FROM event
            WHERE pubkey = $1 AND kind != 0
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `, data.PubKey, data.Limit, data.Offset); err == nil {
			for _, evt := range lastUpdates {
				jevent, _ := json.Marshal(evt)
				(*es).SendEventMessage(string(jevent), "r", "")
			}
		} else if err != sql.ErrNoRows {
			log.Warn().Err(err).
				Str("key", data.PubKey).
				Msg("error fetching updates from requested user")
		}
	}()
}

func requestNote(w http.ResponseWriter, r *http.Request) {
	es := grabNamedSession(r.URL.Query().Get("session"))
	if es == nil {
		w.WriteHeader(400)
		return
	}

	var data struct {
		Id    string `json:"id"`
		Limit int    `json:"limit"`
	}
	json.NewDecoder(r.Body).Decode(&data)
	if data.Id == "" {
		w.WriteHeader(400)
		return
	}
	if data.Limit > 100 || data.Limit <= 0 {
		data.Limit = 50
	}

	go func() {
		var evt Event
		if err := db.Get(&evt, `
            SELECT * FROM event WHERE id = $1
        `, data.Id); err == nil {
			jevent, _ := json.Marshal(evt)
			(*es).SendEventMessage(string(jevent), "r", "")
		}

		if evt.Ref == "" {
			return
		}

		var ref Event
		if err := db.Get(&ref, `
            SELECT * FROM event WHERE id = $1
        `, evt.Ref); err == nil {
			jevent, _ := json.Marshal(ref)
			(*es).SendEventMessage(string(jevent), "r", "")
		}
	}()

	go func() {
		var related []Event
		if err := db.Select(`
            SELECT * FROM event WHERE ref = $1
            LIMIT $2
        `, data.Id, data.Limit); err == nil {
			for _, evt := range related {
				jevent, _ := json.Marshal(evt)
				(*es).SendEventMessage(string(jevent), "r", "")
			}
		}
	}()
}
