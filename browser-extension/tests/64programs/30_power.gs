func def_power(base, exp) {
    local r = 1;
    local i = 1;
    while (i <= exp) {
        r = r * base;
        i += 1;
    }
    return r;
}
onflag {
    say(def_power(2, 10));
}
