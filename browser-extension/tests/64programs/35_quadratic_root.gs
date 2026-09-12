func def_quad_positive(a, b, c) {
    local disc = b * b - 4 * a * c;
    if (disc < 0) { return 0; }
    local root = def_sqrt(disc);
    return (-b + root) / (2 * a);
}
func def_sqrt(n) {
    local x = n;
    local i = 1;
    while (i <= 20) {
        x = (x + n / x) / 2;
        i += 1;
    }
    return x;
}
onflag {
    say(def_quad_positive(1, -5, 6));
}
