func def_count_sub(s, sub) {
    local count = 0;
    local n = length(s);
    local m = length(sub);
    local i = 1;
    while (i <= n - m + 1) {
        local ok = 1;
        local j = 1;
        while (j <= m and ok == 1) {
            if (letter_of(i + j - 1, s) != letter_of(j, sub)) { ok = 0; }
            j += 1;
        }
        if (ok == 1) { count += 1; i += m; }
        else { i += 1; }
    }
    return count;
}
onflag {
    say(def_count_sub("ababab", "ab"));
}
