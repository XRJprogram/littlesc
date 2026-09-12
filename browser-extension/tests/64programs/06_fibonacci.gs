func def_fib(n) {
    if (n <= 1) { return n; }
    local a = 0;
    local b = 1;
    local i = 2;
    while (i <= n) {
        local c = a + b;
        a = b;
        b = c;
        i += 1;
    }
    return b;
}
onflag {
    say(def_fib(10));
}
