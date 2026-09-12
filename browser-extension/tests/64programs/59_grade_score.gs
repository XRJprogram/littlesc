func def_grade(score) {
    if (score >= 90) { return "A"; }
    if (score >= 80) { return "B"; }
    if (score >= 70) { return "C"; }
    if (score >= 60) { return "D"; }
    return "F";
}
onflag {
    say(def_grade(85));
    say(def_grade(45));
}
