package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"time"
)

type ErrorResponse struct {
	Error error `json:"error"`
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

func requestUser(w http.ResponseWriter, r *http.Request) {
	es := grabNamedSession(r.URL.Query().Get("session"))
	if es == nil {
		w.WriteHeader(400)
		return
	}

	var pubkey struct {
		PubKey string `json:"pubkey"`
	}
	json.NewDecoder(r.Body).Decode(&pubkey)
	if pubkey.PubKey == "" {
		w.WriteHeader(400)
		return
	}

	var lastUpdates []Event
	if err := db.Select(&lastUpdates, `
        SELECT *, (SELECT count(*) FROM event AS r WHERE r.ref = event.id) AS rel
        FROM event
        WHERE pubkey = $1
        ORDER BY created_at DESC
        LIMIT 30
    `, pubkey.PubKey); err == nil {
		for _, evt := range lastUpdates {
			jevent, _ := json.Marshal(evt)
			(*es).SendEventMessage(string(jevent), "requested", "")
		}
	}
}

func requestNote(w http.ResponseWriter, r *http.Request) {
	es := grabNamedSession(r.URL.Query().Get("session"))
	if es == nil {
		w.WriteHeader(400)
		return
	}

	var id struct {
		Id string `json:"id"`
	}
	json.NewDecoder(r.Body).Decode(&id)
	if id.Id == "" {
		w.WriteHeader(400)
		return
	}

	go func() {
		var evt Event
		if err := db.Get(&evt, `
            SELECT * FROM event WHERE id = $1
        `, id.Id); err == nil {
			jevent, _ := json.Marshal(evt)
			(*es).SendEventMessage(string(jevent), "requested", "")
		}

		if evt.Ref == "" {
			return
		}

		var ref Event
		if err := db.Get(&ref, `
            SELECT * FROM event WHERE id = $1
        `, evt.Ref); err == nil {
			jevent, _ := json.Marshal(ref)
			(*es).SendEventMessage(string(jevent), "requested", "")
		}
	}()

	go func() {
		var related []Event
		if err := db.Select(`
            SELECT * FROM event WHERE ref = $1
            -- UNION ALL
            -- SELECT * FROM event WHERE ref IN (SELECT ref FROM event WHERE ref = $1)
        `, id.Id); err == nil {
			for _, evt := range related {
				jevent, _ := json.Marshal(evt)
				(*es).SendEventMessage(string(jevent), "requested", "")
			}
		}
	}()
}
