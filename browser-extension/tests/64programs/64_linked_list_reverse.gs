var data = [];
var next_ptr = [0];
var head = 0;
func def_append(val) {
    add val to data;
    local new_id = length(data);
    add 0 to next_ptr;
    if (head == 0) { head = new_id; }
    else {
        local cur = head;
        while (next_ptr[cur] != 0) { cur = next_ptr[cur]; }
        next_ptr[cur] = new_id;
    }
}
func def_reverse() {
    local prev = 0;
    local cur = head;
    while (cur != 0) {
        local nxt = next_ptr[cur];
        next_ptr[cur] = prev;
        prev = cur;
        cur = nxt;
    }
    head = prev;
}
func def_first() {
    if (head == 0) { return 0; }
    return data[head];
}
onflag {
    def_append(1);
    def_append(2);
    def_append(3);
    def_reverse();
    say(def_first());
}
