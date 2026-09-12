var row = [];
func def_pascal(n) {
    local r = 1;
    while (r <= n) {
        row = [];
        local c = 1;
        while (c <= r) {
            if (c == 1 or c == r) { add 1 to row; }
            else {
                local val = row_prev[c - 1] + row_prev[c];
                add val to row;
            }
            c += 1;
        }
        row_prev = [0];
        local k = 1;
        while (k <= length(row)) {
            add row[k] to row_prev;
            k += 1;
        }
        r += 1;
    }
}
var row_prev = [];
onflag {
    def_pascal(5);
    say(row[1]);
    say(row[2]);
    say(row[3]);
    say(row[4]);
    say(row[5]);
}
