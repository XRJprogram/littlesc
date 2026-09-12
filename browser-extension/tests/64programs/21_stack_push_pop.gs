var stack = [];
func def_push(x) { add x to stack; }
func def_pop() {
    local v = stack[length(stack)];
    delete last of stack;
    return v;
}
func def_top() { return stack[length(stack)]; }
func def_size() { return length(stack); }
onflag {
    def_push(10);
    def_push(20);
    say(def_size());
    say(def_top());
    say(def_pop());
    say(def_pop());
}
