var arr = [9, 3, 6, 1, 8, 4];
func def_selection() {
    local n = length(arr);
    local i = 1;
    while (i < n) {
        local min_idx = i;
        local j = i + 1;
        while (j <= n) {
            if (arr[j] < arr[min_idx]) { min_idx = j; }
            j += 1;
        }
        if (min_idx != i) {
            local t = arr[i];
            arr[i] = arr[min_idx];
            arr[min_idx] = t;
        }
        i += 1;
    }
}
onflag {
    def_selection();
    say(arr[1]);
    say(arr[2]);
    say(arr[3]);
    say(arr[4]);
    say(arr[5]);
    say(arr[6]);
}
