package datetime

import (
	"encoding/json"
	"fmt"
	"time"
)

// Clock is a time of day. It unmarshals from "HH:MM", "HH:MM:SS" or an RFC3339
// timestamp (the wall-clock time as written is kept, with no timezone shift).
type Clock struct {
	Hour, Minute int
}

func (c *Clock) UnmarshalJSON(b []byte) error {
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}

	for _, layout := range []string{"15:04", "15:04:05", time.RFC3339} {
		if t, err := time.Parse(layout, s); err == nil {
			c.Hour, c.Minute = t.Hour(), t.Minute()
			return nil
		}
	}
	return fmt.Errorf("invalid time %q, expected HH:MM", s)
}

func (c Clock) MarshalJSON() ([]byte, error) {
	return json.Marshal(fmt.Sprintf("%02d:%02d", c.Hour, c.Minute))
}

// Minutes since midnight, for ordering.
func (c Clock) Minutes() int { return c.Hour*60 + c.Minute }

// On returns this time of day on the calendar day of date, in loc.
func (c Clock) On(date time.Time, loc *time.Location) time.Time {
	return time.Date(date.Year(), date.Month(), date.Day(), c.Hour, c.Minute, 0, 0, loc)
}

// ClockOf reads the wall-clock time of t in loc.
func ClockOf(t time.Time, loc *time.Location) Clock {
	t = t.In(loc)
	return Clock{Hour: t.Hour(), Minute: t.Minute()}
}
