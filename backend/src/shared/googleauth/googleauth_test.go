package googleauth

import "testing"

func TestCheck(t *testing.T) {
	v := New("client-1")
	good := tokenInfo{Aud: "client-1", Iss: "https://accounts.google.com", Email: "A@B.co", EmailVerified: "true", Name: "A"}

	p, err := v.check(good)
	if err != nil || p.Email != "a@b.co" {
		t.Fatalf("good token rejected: %v %+v", err, p)
	}

	for name, mut := range map[string]func(*tokenInfo){
		"wrong aud":  func(i *tokenInfo) { i.Aud = "other" },
		"wrong iss":  func(i *tokenInfo) { i.Iss = "evil.com" },
		"unverified": func(i *tokenInfo) { i.EmailVerified = "false" },
		"no email":   func(i *tokenInfo) { i.Email = "" },
	} {
		bad := good
		mut(&bad)
		if _, err := v.check(bad); err == nil {
			t.Errorf("%s accepted", name)
		}
	}
	if New("") != nil {
		t.Error("empty client id must disable")
	}
}
