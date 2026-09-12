var a = [1, 2, 3, 4];
var b = [5, 6, 7, 8];
var sum = [0, 0, 0, 0];
func def_add_mat() {
    local i = 1;
    while (i <= 4) {
        sum[i] = a[i] + b[i];
        i += 1;
    }
}
onflag {
    def_add_mat();
    say(sum[1]);
    say(sum[2]);
    say(sum[3]);
    say(sum[4]);
}
