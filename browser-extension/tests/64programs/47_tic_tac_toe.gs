var board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
var wins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 4, 7, 2, 5, 8, 3, 6, 9, 1, 5, 9, 3, 5, 7];
func def_has_winner() {
    local i = 1;
    while (i <= length(wins)) {
        local a = wins[i];
        local b = wins[i + 1];
        local c = wins[i + 2];
        if (board[a] != 0 and board[a] == board[b] and board[b] == board[c]) {
            return 1;
        }
        i += 3;
    }
    return 0;
}
func def_place(player, pos) {
    if (board[pos] != 0) { return 0; }
    board[pos] = player;
    return 1;
}
onflag {
    def_place("X", 1);
    def_place("O", 2);
    def_place("X", 5);
    def_place("O", 3);
    def_place("X", 9);
    say(def_has_winner());
}
