var codes = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
var ups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
func def_title(s) {
    local out = "";
    local i = 1;
    local first = 1;
    while (i <= length(s)) {
        local ch = letter_of(i, s);
        if (first == 1 and ch != " ") {
            out = out & def_upper(ch);
            first = 0;
        }
        else {
            if (ch == " ") { first = 1; }
            out = out & ch;
        }
        i += 1;
    }
    return out;
}
func def_upper(ch) {
    local i = 1;
    while (i <= length(codes)) {
        if (codes[i] == ch) { return ups[i]; }
        i += 1;
    }
    return ch;
}
onflag {
    say(def_title("hello world"));
}
