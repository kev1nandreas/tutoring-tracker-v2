// Package objstore holds what the modules that use file storage agree on.
package objstore

import (
	"context"
	"errors"
	"time"
)

// ErrNotFound means the object is not in storage (as opposed to storage being unreachable).
var ErrNotFound = errors.New("object not found in storage")

// Stat is a function that returns the size of a stored object.
type Stat func(ctx context.Context, key string) (int64, error)

// StatWithRetry looks for an object a few times. An upload that was just accepted can take
// a moment to be visible through a proxy, so "not found" is only believed after the last
// try. Any other error (storage unreachable, denied, ...) is returned as is, straight away.
func StatWithRetry(ctx context.Context, stat Stat, key string) (int64, error) {
	const attempts = 3
	var lastErr error
	for i := 0; i < attempts; i++ {
		size, err := stat(ctx, key)
		if err == nil {
			return size, nil
		}
		if !errors.Is(err, ErrNotFound) {
			return 0, err
		}
		lastErr = err
		select {
		case <-ctx.Done():
			return 0, ctx.Err()
		case <-time.After(400 * time.Millisecond):
		}
	}
	return 0, lastErr
}
