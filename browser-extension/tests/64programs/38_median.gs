var arr = [3, 1, 4, 1, 5, 9, 2];
func def_median() {
    local n = length(arr);
    local i = 1;
    while (i < n) {
        local j = 1;
        while (j <= n - i) {
            if (arr[j] > arr[j + 1]) {
                local t = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = t;
            }
            j += 1;
        }
        i += 1;
    }
    if (n % 2 == 1) { return arr[(n + 1) / 2]; }
    return (arr[n / 2] + arr[n / 2 + 1]) / 2;
}
onflag {
    say(def_median());
}
