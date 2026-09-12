var arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
func def_max_subarray() {
    local max_ending = arr[1];
    local max_so_far = arr[1];
    local i = 2;
    while (i <= length(arr)) {
        if (arr[i] > max_ending + arr[i]) { max_ending = arr[i]; }
        else { max_ending = max_ending + arr[i]; }
        if (max_ending > max_so_far) { max_so_far = max_ending; }
        i += 1;
    }
    return max_so_far;
}
onflag {
    say(def_max_subarray());
}
