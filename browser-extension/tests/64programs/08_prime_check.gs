func def_is_prime(n) {
    if (n < 2) { return 0; }
    local i = 2;
    while (i * i <= n) {
        if (n % i == 0) { return 0; }
        i += 1;
    }
    return 1;
}
onflag {
    say(def_is_prime(17));
    say(def_is_prime(18));
}
