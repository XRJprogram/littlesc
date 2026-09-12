var names = ["amy", "bob", "cat"];
var ages = [7, 12, 9];
func def_find_age(name) {
    local i = 1;
    while (i <= length(names)) {
        if (names[i] == name) { return ages[i]; }
        i += 1;
    }
    return -1;
}
onflag {
    say(def_find_age("bob"));
}
