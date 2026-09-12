func def_dist(x1, y1, x2, y2) {
    local dx = x2 - x1;
    local dy = y2 - y1;
    return def_sqrt(dx * dx + dy * dy);
}
func def_sqrt(n) {
    if (n < 0) { return 0; }
    local x = n;
    local i = 1;
    while (i <= 20) {
        x = (x + n / x) / 2;
        i += 1;
    }
    return x;
}
onflag {
    say(def_dist(0, 0, 3, 4));
}
