func def_fact(n) {
    local r = 1;
    local i = 1;
    while (i <= n) {
        r = r * i;
        i += 1;
    }
    return r;
}
onflag {
    say(def_fact(5));
}
