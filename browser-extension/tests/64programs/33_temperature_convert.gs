func def_c2f(c) { return c * 9 / 5 + 32; }
func def_f2c(f) { return (f - 32) * 5 / 9; }
onflag {
    say(def_c2f(100));
    say(def_f2c(212));
}
