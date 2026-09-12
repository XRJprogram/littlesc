func def_regex_test(text, pattern) {
    local n = length(text);
    local m = length(pattern);
    local i = 1;
    while (i <= n) {
        local j = 1;
        local ok = 1;
        while (j <= m and ok == 1) {
            local pc = letter_of(j, pattern);
            local tc = letter_of(i + j - 1, text);
            if (pc != "." and pc != tc) { ok = 0; }
            j += 1;
        }
        if (ok == 1) { return 1; }
        i += 1;
    }
    return 0;
}
onflag {
    say(def_regex_test("aaab", "aab"));
    say(def_regex_test("aaab", "zzz"));
}
