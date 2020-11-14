package main

import (
	"encoding/json"
	"net/http"
)

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
