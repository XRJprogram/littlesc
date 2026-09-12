func def_bin2dec(s) {
    local result = 0;
    local n = length(s);
    local i = 1;
    while (i <= n) {
        local bit = letter_of(i, s);
        result = result * 2;
        if (bit == "1") { result += 1; }
        i += 1;
    }
    return result;
}
onflag {
    say(def_bin2dec("1010"));
}
