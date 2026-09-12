func def_mult_table(n) {
    local i = 1;
    while (i <= n) {
        say(5 * i);
        i += 1;
    }
}
onflag {
    def_mult_table(5);
}
