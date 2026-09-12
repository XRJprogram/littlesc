var arr = [7, 2, 9, 1, 5, 8, 3, 6];
func def_partition(lo, hi) {
    local pivot = arr[hi];
    local i = lo - 1;
    local j = lo;
    while (j < hi) {
        if (arr[j] <= pivot) {
            i += 1;
            local t = arr[i];
            arr[i] = arr[j];
            arr[j] = t;
        }
        j += 1;
    }
    local t2 = arr[i + 1];
    arr[i + 1] = arr[hi];
    arr[hi] = t2;
    return i + 1;
}
func def_qsort(lo, hi) {
    if (lo >= hi) { return; }
    local p = def_partition(lo, hi);
    def_qsort(lo, p - 1);
    def_qsort(p + 1, hi);
}
onflag {
    def_qsort(1, 8);
    say(arr[1]);
    say(arr[2]);
    say(arr[3]);
    say(arr[4]);
    say(arr[5]);
    say(arr[6]);
    say(arr[7]);
    say(arr[8]);
}
