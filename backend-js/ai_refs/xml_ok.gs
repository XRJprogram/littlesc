var g_tagstk = [];
func def_xml_ok(s) {
    g_tagstk = [];
    local i = 1;
    local n = length(s);
    while (i <= n) {
        if (letter_of(i, s) == "<") {
            local j = i + 1;
            local name = "";
            local is_close = false;
            if (j <= n and letter_of(j, s) == "/") { is_close = true; j += 1; }
            while (j <= n and letter_of(j, s) != ">") { name = name & letter_of(j, s); j += 1; }
            i = j;
            if (name != "" and letter_of(length(name), name) == "/") { }
            else if (is_close) {
                local top = g_tagstk[length(g_tagstk)];
                delete last of g_tagstk;
                if (top != name) { return 0; }
            }
            else { add name to g_tagstk; }
        }
        i += 1;
    }
    if (length(g_tagstk) == 0) { return 1; }
    return 0;
}