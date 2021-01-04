package main

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

var watchers = make(map[string][]*websocket.Conn)
var backwatchers = make(map[*websocket.Conn][]string)
var wlock = sync.Mutex{}

func watchPubKey(key string, ws *websocket.Conn) {
	wlock.Lock()
	defer wlock.Unlock()

	currentKeys, _ := backwatchers[ws]
	backwatchers[ws] = append(currentKeys, key)

	if wss, ok := watchers[key]; ok {
		watchers[key] = append(wss, ws)
	} else {
		watchers[key] = []*websocket.Conn{ws}
	}
}

func unwatchPubKey(excludedKey string, ws *websocket.Conn) {
	wlock.Lock()
	defer wlock.Unlock()

	if wss, ok := watchers[excludedKey]; ok {
		newWss := make([]*websocket.Conn, len(wss)-1)

		var i = 0
		for _, existingWs := range wss {
			if existingWs == ws {
				continue
			}
			newWss[i] = existingWs
			i++
		}

		watchers[excludedKey] = newWss
	}

	currentKeys, _ := backwatchers[ws]
	newKeys := make([]string, 0, len(currentKeys))
	for _, currentKey := range currentKeys {
		if excludedKey == currentKey {
			continue
		}
		newKeys = append(newKeys, currentKey)
	}

	backwatchers[ws] = newKeys
}

func removeFromWatchers(es *websocket.Conn) {
	wlock.Lock()
	defer wlock.Unlock()

	for _, key := range backwatchers[es] {
		if arr, ok := watchers[key]; ok {
			newarr := make([]*websocket.Conn, len(arr)-1)
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
		for _, conn := range arr {
			jevent, _ := json.Marshal([]interface{}{
				evt,
				"n",
			})
			conn.WriteMessage(websocket.TextMessage, jevent)
		}
	}
}
