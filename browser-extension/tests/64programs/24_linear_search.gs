var arr = [4, 7, 1, 9, 3, 6];
func def_search(tgt) {
    local i = 1;
    while (i <= length(arr)) {
        if (arr[i] == tgt) { return i; }
        i += 1;
    }
    return -1;
}
onflag {
    say(def_search(9));
    say(def_search(99));
}
