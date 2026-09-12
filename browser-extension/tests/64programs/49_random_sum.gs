func def_rand_sum() {
    local total = 0;
    local i = 1;
    while (i <= 5) {
        local r = pick_random(1, 10);
        total = total + r;
        i += 1;
    }
    return total;
}
onflag {
    say(def_rand_sum());
}
