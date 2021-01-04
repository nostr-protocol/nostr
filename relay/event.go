package main

import (
	"encoding/hex"
	"encoding/json"
	"fmt"

	"github.com/fiatjaf/schnorr"
)

const (
	KindSetMetadata     uint8 = 0
	KindTextNote        uint8 = 1
	KindRecommendServer uint8 = 2
	KindContactList     uint8 = 3
)

type Event struct {
	ID string `db:"id" json:"id"` // it's the hash of the serialized event

	PubKey    string `db:"pubkey" json:"pubkey"`
	CreatedAt uint32 `db:"created_at" json:"created_at"`

	Kind uint8 `db:"kind" json:"kind"`

	Tags    []Tag  `db:"tag" json:"tags"`
	Content string `db:"content" json:"content"`
	Sig     string `db:"sig" json:"sig"`
}

type Tag []interface{}

// Serialize outputs a byte array that can be hashed/signed to identify/authenticate
func (evt *Event) Serialize() []byte {
	// the serialization process is just putting everything into a JSON array
	// so the order is kept
	arr := make([]interface{}, 6)

	// version: 0
	arr[0] = 0

	// pubkey
	arr[1] = evt.PubKey

	// created_at
	arr[2] = int64(evt.CreatedAt)

	// kind
	arr[3] = int64(evt.Kind)

	// tags
	arr[4] = evt.Tags

	// content
	arr[5] = evt.Content

	serialized, _ := json.Marshal(arr)
	return serialized
}

// CheckSignature checks if the signature is valid for the id
// (which is a hash of the serialized event content).
// returns an error if the signature itself is invalid.
func (evt Event) CheckSignature() (bool, error) {
	// read and check pubkey
	pubkeyb, err := hex.DecodeString(evt.PubKey)
	if err != nil {
		return false, err
	}
	if len(pubkeyb) != 32 {
		return false, fmt.Errorf("pubkey must be 32 bytes, not %d", len(pubkeyb))
	}

	// check tags
	for _, tag := range evt.Tags {
		for _, item := range tag {
			switch item.(type) {
			case string, int64, float64, int, bool:
				// fine
			default:
				// not fine
				return false, fmt.Errorf("tag contains an invalid value %v", item)
			}
		}
	}

	hash, _ := hex.DecodeString(evt.ID)
	if len(hash) != 32 {
		return false, fmt.Errorf("invalid event id/hash when checking signature (%s)",
			evt.ID)
	}

	sig, err := hex.DecodeString(evt.Sig)
	if err != nil {
		return false, fmt.Errorf("signature is invalid hex: %w", err)
	}
	if len(sig) != 64 {
		return false, fmt.Errorf("signature must be 64 bytes, not %d", len(sig))
	}

	var p [32]byte
	copy(p[:], pubkeyb)

	var h [32]byte
	copy(h[:], hash)

	var s [64]byte
	copy(s[:], sig)

	return schnorr.Verify(p, h, s)
}
