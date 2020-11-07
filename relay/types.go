package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"fmt"

	"github.com/btcsuite/btcd/btcec"
)

const (
	EventSetMetadata     uint8 = 0
	EventTextNote        uint8 = 1
	EventDelete          uint8 = 2
	EventRecommendServer uint8 = 3
)

type Event struct {
	Pubkey string `db:"pubkey"`
	Time   uint32 `db:"time"`

	Kind uint8 `db:"kind"`
	// - set_metadata
	// - text_note
	// - delete

	Content   string `db:"content"`
	Signature string `db:"signature"`
}

// Serialize outputs a byte array that can be hashed/signed to identify/authenticate
// this event. An error will be returned if anything is malformed.
func (evt *Event) Serialize() ([]byte, error) {
	b := bytes.Buffer{}

	// version: 0
	b.Write([]byte{0})

	// pubkey
	pubkeyb, err := hex.DecodeString(evt.Pubkey)
	if err != nil {
		return nil, err
	}
	pubkey, err := btcec.ParsePubKey(pubkeyb, btcec.S256())
	if err != nil {
		return nil, fmt.Errorf("error parsing pubkey: %w", err)
	}
	if evt.Pubkey != hex.EncodeToString(pubkey.SerializeCompressed()) {
		return nil, fmt.Errorf("pubkey is not serialized in compressed format")
	}
	if _, err = b.Write(pubkeyb); err != nil {
		return nil, err
	}

	// time
	var timeb [4]byte
	binary.BigEndian.PutUint32(timeb[:], evt.Time)
	if _, err := b.Write(timeb[:]); err != nil {
		return nil, err
	}

	// kind
	var kindb [1]byte
	kindb[0] = evt.Kind
	if _, err := b.Write(kindb[:]); err != nil {
		return nil, err
	}

	// content
	if _, err = b.Write([]byte(evt.Content)); err != nil {
		return nil, err
	}

	return b.Bytes(), nil
}

// CheckSignature checks if the signature is valid for the serialized event.
// It will call Serialize() and return an error if that raises an error or if
// the signature itself is invalid.
func (evt Event) CheckSignature() (bool, error) {
	serialized, err := evt.Serialize()
	if err != nil {
		return false, fmt.Errorf("serialization error: %w", err)
	}

	// validity of these is checked by Serialize()
	pubkeyb, _ := hex.DecodeString(evt.Pubkey)
	pubkey, _ := btcec.ParsePubKey(pubkeyb, btcec.S256())

	bsig, err := hex.DecodeString(evt.Signature)
	if err != nil {
		return false, fmt.Errorf("signature is invalid hex: %w", err)
	}
	signature, err := btcec.ParseDERSignature(bsig, btcec.S256())
	if err != nil {
		return false, fmt.Errorf("failed to parse DER signature: %w", err)
	}

	hash := sha256.Sum256(serialized)
	return signature.Verify(hash[:], pubkey), nil
}
