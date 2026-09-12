var arr = [1, 3, 5, 7, 9, 11, 13];
func def_bsearch(tgt) {
    local lo = 1;
    local hi = length(arr);
    while (lo <= hi) {
        local mid = (lo + hi) / 2;
        if (arr[mid] == tgt) { return mid; }
        else if (arr[mid] < tgt) { lo = mid + 1; }
        else { hi = mid - 1; }
    }
    return -1;
}
onflag {
    say(def_bsearch(7));
    say(def_bsearch(4));
}
