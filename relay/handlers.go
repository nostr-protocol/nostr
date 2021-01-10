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

	"github.com/gorilla/websocket"
	"golang.org/x/time/rate"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = pongWait / 2

	// Maximum message size allowed from peer.
	maxMessageSize = 512000
)

var ratelimiter = rate.NewLimiter(rate.Every(time.Second*40), 2)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func handleWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Warn().Err(err).Msg("failed to upgrade websocket")
		return
	}

	// reader
	go func() {
		defer func() {
			conn.Close()
		}()

		conn.SetReadLimit(maxMessageSize)
		conn.SetReadDeadline(time.Now().Add(pongWait))
		conn.SetPongHandler(func(string) error {
			conn.SetReadDeadline(time.Now().Add(pongWait))
			return nil
		})

		for {
			typ, message, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(
					err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Warn().Err(err).Msg("unexpected close error")
				}
				break
			}

			if typ == websocket.PingMessage {
				conn.WriteMessage(websocket.PongMessage, nil)
				continue
			}

			text := string(message)

			switch {
			case text == "PING":
				conn.WriteMessage(websocket.TextMessage, []byte("PONG"))

			case strings.HasPrefix(text, "{"):
				// it's a new event
				err = saveEvent(message)

			case strings.HasPrefix(text, "sub-key:"):
				watchPubKey(strings.TrimSpace(text[8:]), conn)

			case strings.HasPrefix(text, "unsub-key:"):
				unwatchPubKey(strings.TrimSpace(text[10:]), conn)

			case strings.HasPrefix(text, "req-feed:"):
				err = requestFeed(message[len([]byte("req-feed:")):], conn)

			case strings.HasPrefix(text, "req-event:"):
				err = requestEvent(message[len([]byte("req-event")):], conn)

			case strings.HasPrefix(text, "req-key:"):
				err = requestKey(message[len([]byte("req-key")):], conn)
			}

			if err != nil {
				errj, _ := json.Marshal([]interface{}{
					"notice",
					err.Error(),
				})
				conn.WriteMessage(websocket.TextMessage, errj)
				continue
			}
		}
	}()

	// writer
	go func() {
		ticker := time.NewTicker(pingPeriod)
		defer func() {
			ticker.Stop()
			conn.Close()
		}()

		for {
			select {
			case <-ticker.C:
				conn.SetWriteDeadline(time.Now().Add(writeWait))
				err := conn.WriteMessage(websocket.TextMessage, []byte("PING"))
				if err != nil {
					log.Warn().Err(err).Msg("error writing ping, closing websocket")
					return
				}
				conn.WriteMessage(websocket.PingMessage, nil)
			}
		}
	}()
}

func saveEvent(body []byte) error {
	if !ratelimiter.Allow() {
		return errors.New("rate-limit")
	}

	var evt Event
	err := json.Unmarshal(body, &evt)
	if err != nil {
		log.Warn().Err(err).Msg("couldn't decode body")
		return errors.New("failed to decode event")
	}

	// disallow large contents
	if len(evt.Content) > 1000 {
		log.Warn().Err(err).Msg("event content too large")
		return errors.New("event content too large")
	}

	// check serialization
	serialized := evt.Serialize()

	// assign ID
	hash := sha256.Sum256(serialized)
	evt.ID = hex.EncodeToString(hash[:])

	// check signature (requires the ID to be set)
	if ok, err := evt.CheckSignature(); err != nil {
		log.Warn().Err(err).Msg("signature verification error")
		return errors.New("signature verification error")
	} else if !ok {
		log.Warn().Err(err).Msg("signature invalid")
		return errors.New("signature invalid")
	}

	// react to different kinds of events
	switch evt.Kind {
	case KindSetMetadata:
		// delete past set_metadata events from this user
		db.Exec(`DELETE FROM event WHERE pubkey = $1 AND kind = 1`, evt.PubKey)
	case KindTextNote:
		// do nothing
	case KindRecommendServer:
		// delete past recommend_server events equal to this one
		db.Exec(`DELETE FROM event WHERE pubkey = $1 AND kind = 2 AND content = $2`,
			evt.PubKey, evt.Content)
	case KindContactList:
		// delete past contact lists from this same pubkey
		db.Exec(`DELETE FROM event WHERE pubkey = $1 AND kind = 3`, evt.PubKey)
	}

	// insert
	tagsj, _ := json.Marshal(evt.Tags)
	_, err = db.Exec(`
        INSERT INTO event (id, pubkey, created_at, kind, tags, content, sig)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, evt.ID, evt.PubKey, evt.CreatedAt, evt.Kind, tagsj, evt.Content, evt.Sig)
	if err != nil {
		if strings.Index(err.Error(), "UNIQUE") != -1 {
			// already exists
			return nil
		}

		log.Warn().Err(err).Str("pubkey", evt.PubKey).Msg("failed to save")
		return errors.New("failed to save event")
	}

	notifyPubKeyEvent(evt.PubKey, &evt)
	return nil
}

func requestFeed(body []byte, conn *websocket.Conn) error {
	var data struct {
		Limit  int `json:"limit"`
		Offset int `json:"offset"`
	}
	json.Unmarshal(body, &data)

	if data.Limit <= 0 || data.Limit > 100 {
		data.Limit = 50
	}
	if data.Offset < 0 {
		data.Offset = 0
	} else if data.Offset > 500 {
		return errors.New("offset over 500")
	}

	keys, ok := backwatchers[conn]
	if !ok {
		return errors.New("not subscribed to anything")
	}

	inkeys := make([]string, 0, len(keys))
	for _, key := range keys {
		// to prevent sql attack here we will check if these keys are valid 32byte hex
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
		log.Warn().Err(err).Interface("keys", keys).Msg("failed to fetch events")
		return errors.New("failed to fetch events")
	}

	for _, evt := range lastUpdates {
		jevent, _ := json.Marshal([]interface{}{
			evt,
			"p",
		})
		conn.WriteMessage(websocket.TextMessage, jevent)
	}

	return nil
}

func requestKey(body []byte, conn *websocket.Conn) error {
	var data struct {
		Key    string `json:"key"`
		Limit  int    `json:"limit"`
		Offset int    `json:"offset"`
	}
	json.Unmarshal(body, &data)
	if data.Key == "" {
		return errors.New("invalid pubkey")
	}
	if data.Limit <= 0 || data.Limit > 100 {
		data.Limit = 30
	}
	if data.Offset < 0 {
		data.Offset = 0
	} else if data.Offset > 300 {
		return errors.New("offset over 300")
	}

	go func() {
		var metadata Event
		if err := db.Get(&metadata, `
            SELECT * FROM event
            WHERE pubkey = $1 AND kind = 0
        `, data.Key); err == nil {
			jevent, _ := json.Marshal([]interface{}{
				metadata,
				"r",
			})
			conn.WriteMessage(websocket.TextMessage, jevent)
		} else if err != sql.ErrNoRows {
			log.Warn().Err(err).
				Str("key", data.Key).
				Msg("error fetching metadata from requested user")
		}
	}()

	go func() {
		var lastUpdates []Event
		if err := db.Select(&lastUpdates, `
            SELECT * FROM event
            WHERE pubkey = $1 AND kind != 0
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, data.Key, data.Limit, data.Offset); err == nil {
			for _, evt := range lastUpdates {
				jevent, _ := json.Marshal([]interface{}{
					evt,
					"r",
				})
				conn.WriteMessage(websocket.TextMessage, jevent)
			}
		} else if err != sql.ErrNoRows {
			log.Warn().Err(err).
				Str("key", data.Key).
				Msg("error fetching updates from requested user")
		}
	}()

	return nil
}

func requestEvent(body []byte, conn *websocket.Conn) error {
	var data struct {
		Id    string `json:"id"`
		Limit int    `json:"limit"`
	}
	json.Unmarshal(body, &data)
	if data.Id == "" {
		return errors.New("no id provided")
	}
	if data.Limit > 100 || data.Limit <= 0 {
		data.Limit = 50
	}

	go func() {
		// get requested event
		var evt Event
		if err := db.Get(&evt, `
            SELECT * FROM event WHERE id = $1
        `, data.Id); err == nil {
			jevent, _ := json.Marshal([]interface{}{
				evt,
				"r",
			})
			conn.WriteMessage(websocket.TextMessage, jevent)
		} else if err != sql.ErrNoRows {
			log.Warn().Err(err).
				Str("key", data.Id).
				Msg("error fetching a specific event")
		}

		for _, tag := range evt.Tags {
			log.Print(tag)
			// get referenced event TODO
			// var ref Event
			// if err := db.Get(&ref, `
			//     SELECT * FROM event WHERE id = $1
			// `, evt.Ref); err == nil {
			// 	jevent, _ := json.Marshal(ref)
			// 	(*es).SendEventMessage(string(jevent), "r", "")
			// } else if err != sql.ErrNoRows {
			// 	log.Warn().Err(err).
			// 		Str("key", data.Id).Str("ref", evt.Ref).
			// 		Msg("error fetching a referenced event")
			// }
		}
	}()

	go func() {
		// get events that reference this
		var related []Event
		if err := db.Select(&related, `
            SELECT * FROM event
            WHERE ref = $1
            LIMIT $2
        `, data.Id, data.Limit); err == nil {
			for _, evt := range related {
				jevent, _ := json.Marshal([]interface{}{
					evt,
					"r",
				})
				conn.WriteMessage(websocket.TextMessage, jevent)
			}
		} else if err != sql.ErrNoRows {
			log.Warn().Err(err).
				Str("key", data.Id).
				Msg("error fetching events that reference requested event")
		}
	}()

	return nil
}
