func def_is_pal(s) {
    local i = 1;
    local n = length(s);
    while (i <= n / 2) {
        if (letter_of(i, s) != letter_of(n - i + 1, s)) { return 0; }
        i += 1;
    }
    return 1;
}
onflag {
    say(def_is_pal("racecar"));
    say(def_is_pal("hello"));
}
