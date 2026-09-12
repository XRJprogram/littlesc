func def_gcd(a, b) {
    while (b > 0) {
        local t = a % b;
        a = b;
        b = t;
    }
    return a;
}
func def_lcm(a, b) {
    if (a == 0 or b == 0) { return 0; }
    return a / def_gcd(a, b) * b;
}
onflag {
    say(def_lcm(4, 6));
}
