var values = [1, 2, 1, 3, 2, 1];
var counts = [];
var keys = [];
func def_frequency() {
    local i = 1;
    while (i <= length(values)) {
        local v = values[i];
        local found = 0;
        local j = 1;
        while (j <= length(keys)) {
            if (keys[j] == v) {
                counts[j] = counts[j] + 1;
                found = 1;
            }
            j += 1;
        }
        if (found == 0) { add v to keys; add 1 to counts; }
        i += 1;
    }
}
func def_count_of(v) {
    local i = 1;
    while (i <= length(keys)) {
        if (keys[i] == v) { return counts[i]; }
        i += 1;
    }
    return 0;
}
onflag {
    def_frequency();
    say(def_count_of(1));
    say(def_count_of(2));
    say(def_count_of(3));
}
