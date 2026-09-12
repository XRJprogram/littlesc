var arr = [1, 2, 2, 3, 2, 4, 2];
func def_mode() {
    local n = length(arr);
    local best = arr[1];
    local best_count = 0;
    local i = 1;
    while (i <= n) {
        local cur = arr[i];
        local count = 0;
        local j = 1;
        while (j <= n) {
            if (arr[j] == cur) { count += 1; }
            j += 1;
        }
        if (count > best_count) { best_count = count; best = cur; }
        i += 1;
    }
    return best;
}
onflag {
    say(def_mode());
}
