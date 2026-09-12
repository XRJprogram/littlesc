var grid = [1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1];
var next = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
func def_count_alive(row, col) {
    local count = 0;
    local dr = -1;
    while (dr <= 1) {
        local dc = -1;
        while (dc <= 1) {
            if (dr != 0 or dc != 0) {
                local nr = row + dr;
                local nc = col + dc;
                if (nr >= 1 and nr <= 4 and nc >= 1 and nc <= 4) {
                    if (grid[(nr - 1) * 4 + nc] == 1) { count += 1; }
                }
            }
            dc += 1;
        }
        dr += 1;
    }
    return count;
}
func def_step() {
    local r = 1;
    while (r <= 4) {
        local c = 1;
        while (c <= 4) {
            local idx = (r - 1) * 4 + c;
            local alive = def_count_alive(r, c);
            local cell = grid[idx];
            if (cell == 1) {
                if (alive == 2 or alive == 3) { next[idx] = 1; }
                else { next[idx] = 0; }
            }
            else {
                if (alive == 3) { next[idx] = 1; }
                else { next[idx] = 0; }
            }
            c += 1;
        }
        r += 1;
    }
    local i = 1;
    while (i <= 16) { grid[i] = next[i]; i += 1; }
}
func def_total_alive() {
    local total = 0;
    local i = 1;
    while (i <= 16) {
        if (grid[i] == 1) { total += 1; }
        i += 1;
    }
    return total;
}
onflag {
    def_step();
    say(def_total_alive());
}
