func def_gsum(a, r, n) {
    if (r == 1) { return a * n; }
    local p = def_power(r, n);
    return a * (p - 1) / (r - 1);
}
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
    say(def_gsum(1, 2, 5));
}
