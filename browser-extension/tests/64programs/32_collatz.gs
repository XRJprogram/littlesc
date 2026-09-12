func def_collatz_steps(n) {
    local steps = 0;
    while (n > 1) {
        if (n % 2 == 0) { n = n / 2; }
        else { n = n * 3 + 1; }
        steps += 1;
    }
    return steps;
}
onflag {
    say(def_collatz_steps(27));
}
