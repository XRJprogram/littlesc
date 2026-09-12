func def_is_perfect(n) {
    local sum = 0;
    local i = 1;
    while (i < n) {
        if (n % i == 0) { sum += i; }
        i += 1;
    }
    if (sum == n) { return 1; }
    return 0;
}
onflag {
    say(def_is_perfect(28));
    say(def_is_perfect(10));
}
