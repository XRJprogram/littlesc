func def_word_count(s) {
    local count = 0;
    local i = 1;
    local in_word = 0;
    while (i <= length(s)) {
        local ch = letter_of(i, s);
        if (ch == " ") {
            if (in_word == 1) { count += 1; in_word = 0; }
        }
        else { in_word = 1; }
        i += 1;
    }
    if (in_word == 1) { count += 1; }
    return count;
}
onflag {
    say(def_word_count("hello world foo"));
}
