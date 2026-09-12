list g_bs;
list g_bp;
func def_m_from(s, p, st, pj0) {
    delete g_bs;
    delete g_bp;
    local si = st;
    local pj = pj0;
    local state = 0;
    while (state == 0) {
        if (pj > length(p)) { state = 1; }
        else {
            local c = letter_of(pj, p);
            local nxt = "";
            if (pj < length(p)) { nxt = letter_of(pj + 1, p); }
            if (nxt == "*") { add si to g_bs; add pj to g_bp; pj += 2; }
            else if (si <= length(s) and (c == "." or letter_of(si, s) == c)) { si += 1; pj += 1; }
            else {
                local got = false;
                while (length(g_bs) > 0 and not got) {
                    local ts = g_bs[length(g_bs)];
                    local tp = g_bp[length(g_bp)];
                    delete last of g_bs;
                    delete last of g_bp;
                    // Match one more repetition of the starred atom, then stay
                    // ON the atom (not past its '*') and re-push the new state,
                    // so `.*` can consume several characters across backtracks.
                    if (ts <= length(s) and (letter_of(tp, p) == "." or letter_of(ts, s) == letter_of(tp, p))) {
                        si = ts + 1;
                        pj = tp;
                        add si to g_bs;
                        add tp to g_bp;
                        got = true;
                    }
                }
                if (not got) { state = 2; }
            }
        }
    }
    if (state == 1) { return 1; }
    return 0;
}
func def_regex_test(s, pat) {
    if (letter_of(1, pat) == "^") { return def_m_from(s, pat, 1, 2); }
    local st = 1;
    while (st <= length(s) + 1) {
        if (def_m_from(s, pat, st, 1) == 1) { return 1; }
        st += 1;
    }
    return 0;
}
onflag {
    say(def_regex_test("hello", "h.*o"));
    say(def_regex_test("abc", "^a.c"));
    say(def_regex_test("xyz", "a*"));
    say(def_regex_test("abc", "^b"));
}