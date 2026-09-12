func def_vowels(s) {
    local count = 0;
    local i = 1;
    while (i <= length(s)) {
        local ch = letter_of(i, s);
        if (ch == "a" or ch == "e" or ch == "i" or ch == "o" or ch == "u") { count += 1; }
        i += 1;
    }
    return count;
}
onflag {
    say(def_vowels("hello"));
}
