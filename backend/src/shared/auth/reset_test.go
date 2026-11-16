package auth

import "testing"

func TestResetTokenRoundTripAndSingleUse(t *testing.T) {
	tok, err := GenerateResetToken("user-1", "hash-old")
	if err != nil {
		t.Fatal(err)
	}
	id, fp, err := ParseResetToken(tok)
	if err != nil || id != "user-1" {
		t.Fatalf("parse: %v id=%q", err, id)
	}
	if !MatchesPassword(fp, "hash-old") {
		t.Fatal("fingerprint must match the current password")
	}
	if MatchesPassword(fp, "hash-new") {
		t.Fatal("token must stop working after the password changes")
	}
}

func TestResetTokenRejectsLoginToken(t *testing.T) {
	login, _ := GenerateToken("user-1", "bob", "b@x.co", "student")
	if _, _, err := ParseResetToken(login); err == nil {
		t.Fatal("a login token must not work as a reset token")
	}
	if _, _, err := ParseResetToken("garbage"); err == nil {
		t.Fatal("garbage accepted")
	}
}
