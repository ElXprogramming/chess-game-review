export interface SampleGame {
  id: string;
  title: string;
  subtitle: string;
  white: string;
  black: string;
  result: string;
  pgn: string;
}

export const SAMPLE_GAMES: SampleGame[] = [
  {
    id: 'byrne-fischer',
    title: 'Game of the Century',
    subtitle: '13-year-old Bobby Fischer plays 17... Be6!! queen sacrifice',
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    result: '0-1',
    pgn: `[Event "Third Rosenwald Trophy"]
[Site "New York, NY USA"]
[Date "1956.10.17"]
[Round "8"]
[White "Donald Byrne"]
[Black "Bobby Fischer"]
[Result "0-1"]
[ECO "D92"]
[WhiteElo "2450"]
[BlackElo "2300"]

1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1`,
  },
  {
    id: 'opera-game',
    title: 'The Opera Game',
    subtitle: 'Paul Morphy immortal open game masterpiece (1858)',
    white: 'Paul Morphy',
    black: 'Duke of Brunswick & Count Isouard',
    result: '1-0',
    pgn: `[Event "Paris Opera"]
[Site "Paris FRA"]
[Date "1858.11.02"]
[Round "1"]
[White "Paul Morphy"]
[Black "Duke of Brunswick / Count Isouard"]
[Result "1-0"]
[ECO "C41"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`,
  },
  {
    id: 'kasparov-topalov',
    title: "Kasparov's Immortal",
    subtitle: 'Wijk aan Zee 1999: Garry Kasparov with 24. Rxd4!!',
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    result: '1-0',
    pgn: `[Event "Hoogovens Group A"]
[Site "Wijk aan Zee NED"]
[Date "1999.01.20"]
[Round "4"]
[White "Garry Kasparov"]
[Black "Veselin Topalov"]
[Result "1-0"]
[ECO "B07"]
[WhiteElo "2812"]
[BlackElo "2700"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`,
  },
  {
    id: 'club-blitz-drama',
    title: 'Club Championship Drama',
    subtitle: 'Sharp tactical duel featuring brilliancies and blunders',
    white: 'Alex Rivera',
    black: 'David Chen',
    result: '1-0',
    pgn: `[Event "City Championship 2024"]
[Site "Online"]
[Date "2024.03.15"]
[Round "3"]
[White "Alex Rivera"]
[Black "David Chen"]
[Result "1-0"]
[ECO "C54"]
[WhiteElo "1640"]
[BlackElo "1610"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Nxe4 8. Bxb4 Nxb4 9. Bxf7+ Kxf7 10. Qb3+ d5 11. Ne5+ Ke6 12. Qxb4 c5 13. Qa3 cxd4 14. Nf3 Qf6 15. O-O Re8 16. Nbd2 Kf7 17. Qb3 Be6 18. Qxb7+ Kg8 19. Rae1 Bf7 20. Nxe4 dxe4 21. Rxe4 Rxe4 22. Qxa8+ Re8 23. Qxa7 d3 24. b3 Bd5 25. Qd4 Qxd4 26. Nxd4 d2 27. Nc2 Rc8 28. Ne3 Rc1 29. Rd1 Be4 30. f3 Bc2 31. Kf2 Bxd1 32. Nxd1 Rxd1 33. Ke2 Rg1 34. Kxd2 Rxg2+ 35. Kd3 Rxa2 1-0`,
  },
];
