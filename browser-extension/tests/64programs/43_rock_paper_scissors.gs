func def_winner(a, b) {
    if (a == b) { return "draw"; }
    if (a == "rock" and b == "scissors") { return "a"; }
    if (a == "scissors" and b == "paper") { return "a"; }
    if (a == "paper" and b == "rock") { return "a"; }
    return "b";
}
onflag {
    say(def_winner("rock", "scissors"));
}
