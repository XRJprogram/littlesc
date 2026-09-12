var data = [];
var next_ptr = [0];
var head = 0;
func def_append(val) {
    add val to data;
    local new_id = length(data);
    add 0 to next_ptr;
    if (head == 0) {
        head = new_id;
    }
    else {
        local cur = head;
        while (next_ptr[cur] != 0) { cur = next_ptr[cur]; }
        next_ptr[cur] = new_id;
    }
}
func def_length() {
    local count = 0;
    local cur = head;
    while (cur != 0) {
        count += 1;
        cur = next_ptr[cur];
    }
    return count;
}
onflag {
    def_append(10);
    def_append(20);
    def_append(30);
    say(def_length());
}
