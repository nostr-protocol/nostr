package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"time"
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

func fetchUserUpdates(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "application/json")

	key := r.URL.Query().Get("key")

	var lastUpdates []Event
	err := db.Select(&lastUpdates, `
        SELECT *
        FROM event
        WHERE pubkey = $1
        ORDER BY time DESC
        LIMIT 25
    `, key)
	if err == sql.ErrNoRows {
		lastUpdates = make([]Event, 0)
	} else if err != nil {
		w.WriteHeader(500)
		log.Warn().Err(err).Str("key", key).Msg("failed to fetch updates")
		return
	}

	json.NewEncoder(w).Encode(lastUpdates)
}

func saveUpdate(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "application/json")

	var evt Event
	err := json.NewDecoder(r.Body).Decode(&evt)
	if err != nil {
		w.WriteHeader(400)
		return
	}

	// safety checks
	now := time.Now().UTC().Unix()
	if uint32(now-3600) > evt.Time || uint32(now+3600) < evt.Time {
		w.WriteHeader(400)
		return
	}

	// check serialization
	serialized, err := evt.Serialize()
	if err != nil {
		w.WriteHeader(400)
		return
	}

	// assign ID
	hash := sha256.Sum256(serialized)
	evt.ID = hex.EncodeToString(hash[:])

	// check signature (requires the ID to be set)
	if ok, err := evt.CheckSignature(); err != nil {
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(ErrorResponse{err})
		return
	} else if !ok {
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(ErrorResponse{errors.New("invalid signature")})
		return
	}

	// insert
	_, err = db.Exec(`
        INSERT INTO event (id, pubkey, time, kind, reference, content, signature)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, evt.ID, evt.Pubkey, evt.Time, evt.Kind, evt.Reference, evt.Content, evt.Signature)
	if err != nil {
		w.WriteHeader(500)
		log.Warn().Err(err).Str("pubkey", evt.Pubkey).Msg("failed to save")
		return
	}

	w.WriteHeader(201)
}
