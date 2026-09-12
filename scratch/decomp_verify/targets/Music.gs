target "Music";

costumes "3339a2953a3bf62bb80e54ff575dbced.svg" as "造型1";
sounds "3e20787253ea08f107ecafdcadb83e33.wav" as "typing", "e6680d8b6fbad380567bdc232aeefae4.wav" as "clock", "e31cac701d7b121a86ee6c8149cda4a7.wav" as "ticking", "06e98c73663f3e9216941994a0757090.wav" as "break1", "e6a819a243b8774997a787ae19326762.wav" as "break2", "937483b5a39fcc4804b123c00ccef319.wav" as "break3";
list clone_info_order_type_;
set_x 36;
set_y 28;

proc load_music {
    until (length Music == "0") {
        start_sound Music[1];
        delete Music[1];
    }
}

onflag {
}

orphan {
    delete Music;
    forever {
        wait_until (not (length Music == "0"));
        load_music;
    }
}

