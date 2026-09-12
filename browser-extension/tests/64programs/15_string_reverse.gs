func def_reverse(s) {
    local r = "";
    local i = length(s);
    while (i >= 1) {
        r = r & letter_of(i, s);
        i -= 1;
    }
    return r;
}
onflag {
    say(def_reverse("hello"));
}
