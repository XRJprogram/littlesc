func def_count_bits(n) {
    local count = 0;
    while (n > 0) {
        if (n % 2 == 1) { count += 1; }
        n = n / 2;
    }
    return count;
}
onflag {
    say(def_count_bits(13));
    say(def_count_bits(255));
}
