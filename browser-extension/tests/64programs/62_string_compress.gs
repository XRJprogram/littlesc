func def_compress(s) {
    local out = "";
    local i = 1;
    while (i <= length(s)) {
        local ch = letter_of(i, s);
        local count = 1;
        local j = i + 1;
        while (j <= length(s) and letter_of(j, s) == ch) {
            count += 1;
            j += 1;
        }
        out = out & ch;
        out = out & def_digit(count);
        i = j;
    }
    return out;
}
func def_digit(n) {
    if (n == 1) { return "1"; }
    if (n == 2) { return "2"; }
    if (n == 3) { return "3"; }
    if (n == 4) { return "4"; }
    if (n == 5) { return "5"; }
    if (n == 6) { return "6"; }
    if (n == 7) { return "7"; }
    if (n == 8) { return "8"; }
    return "9";
}
onflag {
    say(def_compress("aaabbc"));
}
