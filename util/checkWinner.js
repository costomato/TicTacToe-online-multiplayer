const checkWinner = (l) => {
    if ((l[4] == l[1] && l[1] == l[7]) || (l[4] == l[3] && l[3] == l[5]) || (l[4] == l[0] && l[0] == l[8]) || (l[4] == l[2] && l[2] == l[6]))
        return l[4]
    if ((l[0] == l[1] && l[1] == l[2]) || (l[0] == l[3] && l[3] == l[6]))
        return l[0]
    if ((l[8] == l[7] && l[7] == l[6]) || (l[8] == l[5] && l[5] == l[2]))
        return l[8]
}

module.exports = checkWinner