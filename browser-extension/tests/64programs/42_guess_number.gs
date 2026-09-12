var secret = 7;
func def_check(guess) {
    if (guess < secret) { return "too low"; }
    if (guess > secret) { return "too high"; }
    return "correct";
}
onflag {
    say(def_check(5));
    say(def_check(10));
    say(def_check(7));
}
