func def_series_sum(a, d, n) {
    local last = a + (n - 1) * d;
    return n * (a + last) / 2;
}
onflag {
    say(def_series_sum(1, 1, 100));
}
