var codes = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
func def_caesar(s, shift) {
    local out = "";
    local i = 1;
    while (i <= length(s)) {
        local ch = letter_of(i, s);
        local code = def_char_code(ch);
        if (code >= 97 and code <= 122) {
            local nc = (code - 97 + shift) % 26 + 97;
            out = out & def_code_char(nc);
        }
        else { out = out & ch; }
        i += 1;
    }
    return out;
}
func def_char_code(ch) {
    local i = 1;
    while (i <= length(codes)) {
        if (codes[i] == ch) { return 96 + i; }
        i += 1;
    }
    return 0;
}
func def_code_char(c) {
    local i = 1;
    while (i <= length(codes)) {
        if (96 + i == c) { return codes[i]; }
        i += 1;
    }
    return "";
}
onflag {
    say(def_caesar("abc", 1));
}
