var arr = [9, 6, 3, 8, 5, 2, 7, 1, 4];
func def_shell() {
    local n = length(arr);
    local gap = n / 2;
    while (gap >= 1) {
        local i = gap + 1;
        while (i <= n) {
            local key = arr[i];
            local j = i;
            while (j > gap and arr[j - gap] > key) {
                arr[j] = arr[j - gap];
                j -= gap;
            }
            arr[j] = key;
            i += 1;
        }
        gap = gap / 2;
    }
}
onflag {
    def_shell();
    say(arr[1]);
    say(arr[2]);
    say(arr[3]);
    say(arr[4]);
    say(arr[5]);
    say(arr[6]);
    say(arr[7]);
    say(arr[8]);
    say(arr[9]);
}
