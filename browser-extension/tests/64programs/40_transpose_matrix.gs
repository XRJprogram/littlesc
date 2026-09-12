var mat = [1, 2, 3, 4, 5, 6];
var out = [0, 0, 0, 0, 0, 0];
func def_transpose(rows, cols) {
    local r = 1;
    while (r <= rows) {
        local c = 1;
        while (c <= cols) {
            local idx = (r - 1) * cols + c;
            local nidx = (c - 1) * rows + r;
            out[nidx] = mat[idx];
            c += 1;
        }
        r += 1;
    }
}
onflag {
    def_transpose(2, 3);
    say(out[1]);
    say(out[2]);
    say(out[3]);
    say(out[4]);
    say(out[5]);
    say(out[6]);
}
