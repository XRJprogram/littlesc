var g_tokens = [];
var g_vals = [];
var g_ops = [];
func def_prec(op) {
    if (op == "*" or op == "/") { return 2; }
    if (op == "+" or op == "-") { return 1; }
    return 0;
}
func def_apply_top() {
    local op = g_ops[length(g_ops)];
    delete last of g_ops;
    local b = g_vals[length(g_vals)];
    delete last of g_vals;
    local a = g_vals[length(g_vals)];
    delete last of g_vals;
    local r = 0;
    if (op == "+") { r = a + b; }
    else if (op == "-") { r = a - b; }
    else if (op == "*") { r = a * b; }
    else { r = a / b; }
    add r to g_vals;
}
func def_lex(s) {
    local i = 1;
    local cur = "";
    while (i <= length(s)) {
        local ch = letter_of(i, s);
        if (ch == " ") { if (cur != "") { add cur to g_tokens; cur = ""; } }
        else if (ch == "+" or ch == "-" or ch == "*" or ch == "/" or ch == "(" or ch == ")") {
            if (cur != "") { add cur to g_tokens; }
            add ch to g_tokens;
            cur = "";
        }
        else { cur = cur & ch; }
        i += 1;
    }
    if (cur != "") { add cur to g_tokens; }
}
func def_calc(expr) {
    g_tokens = [];
    g_vals = [];
    g_ops = [];
    def_lex(expr);
    local i = 1;
    while (i <= length(g_tokens)) {
        local t = g_tokens[i];
        if (t == "(") { add "(" to g_ops; }
        else if (t == ")") {
            while (length(g_ops) > 0 and g_ops[length(g_ops)] != "(") { def_apply_top(); }
            delete last of g_ops;
        }
        else if (t == "+" or t == "-" or t == "*" or t == "/") {
            while (length(g_ops) > 0 and def_prec(g_ops[length(g_ops)]) >= def_prec(t)) { def_apply_top(); }
            add t to g_ops;
        }
        else { add t * 1 to g_vals; }
        i += 1;
    }
    while (length(g_ops) > 0) { def_apply_top(); }
    return g_vals[1];
}
onflag {
    say(def_calc("3 + 5 * 2"));
}
