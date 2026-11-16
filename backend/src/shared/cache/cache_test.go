package cache

import (
	"errors"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/go-redis/redis/v8"
)

func newTestCache(t *testing.T) (*Cache, *miniredis.Miniredis) {
	t.Helper()
	mr := miniredis.RunT(t)
	return New(redis.NewClient(&redis.Options{Addr: mr.Addr()})), mr
}

func TestRememberCachesUntilInvalidated(t *testing.T) {
	c, _ := newTestCache(t)
	calls := 0
	load := func() (int, error) { calls++; return calls, nil }

	for i := 0; i < 3; i++ {
		got, err := Remember(c, NSDashboard, "k", time.Minute, load)
		if err != nil || got != 1 {
			t.Fatalf("call %d: got %d, %v; want cached 1", i, got, err)
		}
	}
	if calls != 1 {
		t.Fatalf("loader ran %d times, want 1", calls)
	}

	c.Invalidate(NSDashboard)
	got, _ := Remember(c, NSDashboard, "k", time.Minute, load)
	if got != 2 || calls != 2 {
		t.Fatalf("after invalidate got %d (calls %d), want a fresh load", got, calls)
	}
}

func TestInvalidateOnlyTouchesItsNamespace(t *testing.T) {
	c, _ := newTestCache(t)
	calls := 0
	load := func() (int, error) { calls++; return calls, nil }

	Remember(c, NSStudents, "k", time.Minute, load)
	c.Invalidate(NSDashboard)
	Remember(c, NSStudents, "k", time.Minute, load)
	if calls != 1 {
		t.Fatalf("students cache was dropped by a dashboard invalidation (calls %d)", calls)
	}
}

func TestKeysAreSeparate(t *testing.T) {
	c, _ := newTestCache(t)
	a, _ := Remember(c, NSDashboard, "a", time.Minute, func() (string, error) { return "A", nil })
	b, _ := Remember(c, NSDashboard, "b", time.Minute, func() (string, error) { return "B", nil })
	if a != "A" || b != "B" {
		t.Fatalf("got %q %q", a, b)
	}
}

func TestLoadErrorIsNotCached(t *testing.T) {
	c, _ := newTestCache(t)
	boom := errors.New("boom")
	if _, err := Remember(c, NSDashboard, "k", time.Minute, func() (int, error) { return 0, boom }); !errors.Is(err, boom) {
		t.Fatalf("err = %v", err)
	}
	got, err := Remember(c, NSDashboard, "k", time.Minute, func() (int, error) { return 7, nil })
	if err != nil || got != 7 {
		t.Fatalf("got %d, %v; want 7 (error must not be cached)", got, err)
	}
}

func TestExpires(t *testing.T) {
	c, mr := newTestCache(t)
	calls := 0
	load := func() (int, error) { calls++; return calls, nil }
	Remember(c, NSDashboard, "k", time.Second, load)
	mr.FastForward(2 * time.Second)
	Remember(c, NSDashboard, "k", time.Second, load)
	if calls != 2 {
		t.Fatalf("calls = %d, want 2 after TTL", calls)
	}
}

func TestFailsOpenWhenRedisIsDown(t *testing.T) {
	c, mr := newTestCache(t)
	mr.Close()
	got, err := Remember(c, NSDashboard, "k", time.Minute, func() (int, error) { return 5, nil })
	if err != nil || got != 5 {
		t.Fatalf("got %d, %v; want the loader result", got, err)
	}
	c.Invalidate(NSDashboard) // must not panic or block
}

func TestNilCache(t *testing.T) {
	var c *Cache
	got, err := Remember(c, NSDashboard, "k", time.Minute, func() (int, error) { return 3, nil })
	if err != nil || got != 3 {
		t.Fatalf("got %d, %v", got, err)
	}
	c.Invalidate(NSDashboard)
}

func TestRawWriteRegexp(t *testing.T) {
	cases := map[string]string{
		`UPDATE pending_validations SET x = 1`:        "pending_validations",
		`  insert into "meetings" (a) values (1)`:     "meetings",
		`DELETE FROM public.attachments WHERE id = 1`: "attachments",
		"UPDATE\n  tutorials SET a=1":                 "tutorials",
	}
	for sql, want := range cases {
		m := rawWrite.FindStringSubmatch(sql)
		if m == nil || m[1] != want {
			t.Errorf("%q -> %v, want %q", sql, m, want)
		}
	}
	if rawWrite.MatchString("SELECT * FROM meetings") {
		t.Error("SELECT must not match")
	}
}
