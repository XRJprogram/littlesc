func def_armstrong(n) {
    local sum = 0;
    local m = n;
    while (m > 0) {
        local d = m % 10;
        sum = sum + d * d * d;
        m = m / 10;
    }
    if (sum == n) { return 1; }
    return 0;
}
onflag {
    say(def_armstrong(153));
    say(def_armstrong(123));
}
