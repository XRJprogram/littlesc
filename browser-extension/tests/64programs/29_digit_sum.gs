func def_digit_sum(n) {
    local sum = 0;
    while (n > 0) {
        sum = sum + n % 10;
        n = n / 10;
    }
    return sum;
}
onflag {
    say(def_digit_sum(1234));
}
