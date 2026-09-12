func def_count_keys(s) {
    local count = 0;
    local i = 1;
    local in_str = 0;
    while (i <= length(s)) {
        local ch = letter_of(i, s);
        if (ch == "\"") {
            if (in_str == 1) { in_str = 0; }
            else { in_str = 1; }
        }
        if (in_str == 0 and ch == ":") { count += 1; }
        i += 1;
    }
    return count;
}
onflag {
    say(def_count_keys("{\"a\":1,\"b\":2,\"c\":3}"));
}
