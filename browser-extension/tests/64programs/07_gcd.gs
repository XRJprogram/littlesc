func def_gcd(a, b) {
    while (b > 0) {
        local t = a % b;
        a = b;
        b = t;
    }
    return a;
}
onflag {
    say(def_gcd(48, 36));
}
