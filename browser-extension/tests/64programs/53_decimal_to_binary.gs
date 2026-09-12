func def_dec2bin(n) {
    local out = "";
    if (n == 0) { return "0"; }
    while (n > 0) {
        if (n % 2 == 0) { out = "0" & out; }
        else { out = "1" & out; }
        n = n / 2;
    }
    return out;
}
onflag {
    say(def_dec2bin(10));
}
