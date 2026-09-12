var arr = [4, 1, 7, 3, 9, 2];
func def_insertion() {
    local n = length(arr);
    local i = 2;
    while (i <= n) {
        local key = arr[i];
        local j = i - 1;
        while (j >= 1 and arr[j] > key) {
            arr[j + 1] = arr[j];
            j -= 1;
        }
        arr[j + 1] = key;
        i += 1;
    }
}
onflag {
    def_insertion();
    say(arr[1]);
    say(arr[2]);
    say(arr[3]);
    say(arr[4]);
    say(arr[5]);
    say(arr[6]);
}
