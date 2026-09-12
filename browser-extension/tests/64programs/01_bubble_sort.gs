var arr = [5, 2, 8, 1, 9, 3];
func def_bubble() {
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
}
onflag {
    def_bubble();
    say(arr[1]);
    say(arr[2]);
    say(arr[3]);
    say(arr[4]);
    say(arr[5]);
    say(arr[6]);
}
