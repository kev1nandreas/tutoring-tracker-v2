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

func TestEmailVerifyToken(t *testing.T) {
	tok, err := GenerateEmailVerifyToken("user-1", "A@x.co")
	if err != nil {
		t.Fatal(err)
	}
	id, fp, err := ParseEmailVerifyToken(tok)
	if err != nil || id != "user-1" {
		t.Fatalf("parse: %v id=%q", err, id)
	}
	if !MatchesEmail(fp, "a@x.co") {
		t.Fatal("must match the same email, case-insensitive")
	}
	if MatchesEmail(fp, "other@x.co") {
		t.Fatal("must stop matching after the email changes")
	}
	// the two token kinds must not be interchangeable
	reset, _ := GenerateResetToken("user-1", "h")
	if _, _, err := ParseEmailVerifyToken(reset); err == nil {
		t.Fatal("reset token accepted as verify token")
	}
	if _, _, err := ParseResetToken(tok); err == nil {
		t.Fatal("verify token accepted as reset token")
	}
}
