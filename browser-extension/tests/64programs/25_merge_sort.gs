var arr = [8, 3, 5, 1, 7, 2, 6, 4];
var temp = [];
func def_merge(lo, mid, hi) {
    local i = lo;
    local j = mid + 1;
    local k = lo;
    while (i <= mid and j <= hi) {
        if (arr[i] <= arr[j]) { temp[k] = arr[i]; i += 1; }
        else { temp[k] = arr[j]; j += 1; }
        k += 1;
    }
    while (i <= mid) { temp[k] = arr[i]; i += 1; k += 1; }
    while (j <= hi) { temp[k] = arr[j]; j += 1; k += 1; }
    local p = lo;
    while (p <= hi) { arr[p] = temp[p]; p += 1; }
}
func def_msort(lo, hi) {
    if (lo >= hi) { return; }
    local mid = (lo + hi) / 2;
    def_msort(lo, mid);
    def_msort(mid + 1, hi);
    def_merge(lo, mid, hi);
}
onflag {
    temp = [0, 0, 0, 0, 0, 0, 0, 0];
    def_msort(1, 8);
    say(arr[1]);
    say(arr[2]);
    say(arr[3]);
    say(arr[4]);
    say(arr[5]);
    say(arr[6]);
    say(arr[7]);
    say(arr[8]);
}
