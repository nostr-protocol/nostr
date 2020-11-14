package main

import (
	"encoding/json"
	"sync"

	"gopkg.in/antage/eventsource.v1"
)

var watchers = make(map[string][]*eventsource.EventSource)
var index = make(map[*eventsource.EventSource][]string)
var wlock = sync.Mutex{}

func watchPubKeys(keys []string, es *eventsource.EventSource) {
	wlock.Lock()
	defer wlock.Unlock()

	index[es] = keys

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

	for _, key := range index[es] {
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
		}
	}
	delete(index, es)
}

func notifyPubKeyEvent(key string, evt *Event) {
	wlock.Lock()
	defer wlock.Unlock()

	if arr, ok := watchers[key]; ok {
		for _, es := range arr {
			jevent, _ := json.Marshal(evt)
			(*es).SendEventMessage(string(jevent), "event", "")
		}
	}
}
