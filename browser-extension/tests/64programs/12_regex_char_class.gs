func def_has_digit(s) {
    local i = 1;
    while (i <= length(s)) {
        local ch = letter_of(i, s);
        if (ch >= "0" and ch <= "9") { return 1; }
        i += 1;
    }
    return 0;
}
onflag {
    say(def_has_digit("abc123"));
    say(def_has_digit("abc"));
}
