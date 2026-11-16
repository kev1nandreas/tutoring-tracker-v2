// Package cache is a small Redis read-through cache for expensive read models
// (dashboards, per-student statistics).
//
// Invalidation uses namespace versions: every key embeds the current version of its
// namespace, and Invalidate bumps that version with one INCR. Old keys are simply never
// read again and expire by TTL, so no SCAN or key bookkeeping is needed. The version is
// read before the data is loaded, so a load that races with a write stores its (possibly
// stale) result under the old version, where nobody looks.
//
// The cache is best effort and fails open: with a nil Redis client, or while Redis is
// down, every call just runs the loader.
package cache

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"sync/atomic"
	"time"

	"github.com/go-redis/redis/v8"
)

// Namespaces. A write to a table invalidates the namespaces that read from it (see hook.go).
const (
	NSDashboard = "dashboard"
	NSStudents  = "students"
	NSTutorials = "tutorials"
)

const (
	prefix = "tt:cache:"
	// opTimeout keeps a slow Redis from slowing requests down.
	opTimeout = 300 * time.Millisecond
	// backoff is how long Redis is skipped after a failure.
	backoff = 10 * time.Second
)

// Cache wraps a Redis client. The zero value and a nil *Cache are valid and cache nothing.
type Cache struct {
	rdb       *redis.Client
	downUntil atomic.Int64 // unix nanos; Redis is skipped until then
}

// New returns a cache backed by rdb. A nil rdb disables caching.
func New(rdb *redis.Client) *Cache { return &Cache{rdb: rdb} }

func (c *Cache) usable() bool {
	return c != nil && c.rdb != nil && time.Now().UnixNano() >= c.downUntil.Load()
}

func (c *Cache) fail(op string, err error) {
	if errors.Is(err, redis.Nil) {
		return
	}
	if c.downUntil.Swap(time.Now().Add(backoff).UnixNano()) < time.Now().UnixNano() {
		log.Printf("cache: %s failed, skipping Redis for %s: %v", op, backoff, err)
	}
}

func (c *Cache) version(ns string) string {
	ctx, cancel := context.WithTimeout(context.Background(), opTimeout)
	defer cancel()
	v, err := c.rdb.Get(ctx, prefix+"ver:"+ns).Result()
	if err != nil {
		c.fail("read version", err)
		return "0"
	}
	return v
}

func dataKey(ns, version, key string) string {
	sum := sha1.Sum([]byte(key))
	return prefix + ns + ":v" + version + ":" + hex.EncodeToString(sum[:])
}

// Remember returns the cached value for key in namespace ns, or runs load and stores the
// result for ttl. Errors from load are returned and never cached.
func Remember[T any](c *Cache, ns, key string, ttl time.Duration, load func() (T, error)) (T, error) {
	if !c.usable() {
		return load()
	}

	k := dataKey(ns, c.version(ns), key)

	ctx, cancel := context.WithTimeout(context.Background(), opTimeout)
	raw, err := c.rdb.Get(ctx, k).Bytes()
	cancel()
	if err == nil {
		var out T
		if json.Unmarshal(raw, &out) == nil {
			return out, nil
		}
		// unreadable entry: fall through and overwrite it
	} else {
		c.fail("get", err)
	}

	val, err := load()
	if err != nil {
		return val, err
	}

	if c.usable() {
		if b, mErr := json.Marshal(val); mErr == nil {
			ctx, cancel := context.WithTimeout(context.Background(), opTimeout)
			if sErr := c.rdb.Set(ctx, k, b, ttl).Err(); sErr != nil {
				c.fail("set", sErr)
			}
			cancel()
		}
	}
	return val, nil
}

// Invalidate makes every cached value in the given namespaces unreadable.
func (c *Cache) Invalidate(namespaces ...string) {
	if c == nil || c.rdb == nil {
		return
	}
	for _, ns := range namespaces {
		ctx, cancel := context.WithTimeout(context.Background(), opTimeout)
		if err := c.rdb.Incr(ctx, prefix+"ver:"+ns).Err(); err != nil {
			c.fail("invalidate "+ns, err)
		}
		cancel()
	}
}
