var queue = [];
func def_enqueue(x) { add x to queue; }
func def_dequeue() {
    local v = queue[1];
    delete 1 of queue;
    return v;
}
func def_front() { return queue[1]; }
func def_size() { return length(queue); }
onflag {
    def_enqueue(1);
    def_enqueue(2);
    def_enqueue(3);
    say(def_size());
    say(def_front());
    say(def_dequeue());
    say(def_dequeue());
}
