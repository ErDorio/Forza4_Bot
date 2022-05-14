//Forza4_thebot
const TGBot = require('node-telegram-bot-api');
const pat = '5198212603:AAHTUnj4b3mO3KRaMbosA8p1_9o5pMwTh9c';
const mysql = require('mysql');

//Connessione
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "forza4bot_games"
});

//Variabili
var player = 1;
var isGaming = false
var table = Array.from(Array(6), () => new Array(7));
var forza4keyboard = [
    ["C0", "C1", "C2", "C3", "C4", "C5", "C6"],
    ["Exit Game"]
];

//Metodi utili
function newGame()
{
    isGaming = true;
    player = 1;
    for (var i = 0; i < 6; i++)
    {
        for (var j = 0; j < 7; j++)
        {
            table[i][j] = "0";
        }
    }
    if(connection.state === 'disconnected') 
        openDatabase();
}
function stopGame(msg)
{
    isGaming = false;
    bot.sendMessage(msg.chat.id, "You stopped the game. Feel free to start a new one");
    botStart(msg);
}
function tableMessage()
{
    var Message = "";
    for (var i = 0; i < 6; i++)
    {
        for (var j = 0; j < 7; j++)
        {
            Message += table[i][j];
            if (j != 6) Message += "|";
        }
        if(i != 5) Message += "\n";
    }
    return Message;
}
function insertCoin(column, player)
{
    for(var i = 5; i >= 0; i--)
    {
        if(table[i][column] === "0")
        {
            table[i][column] = player;
            return true;
        }
        else if(table[i][column] !== "0" && i == 0)
        {
            return false;
        }
    }
}
function openDatabase()
{
    connection.connect((err) =>
    {
        if(err) throw err;
        console.log("Connected");
    });
}

//Start e Stop
const bot = new TGBot(pat,
{
    polling: true    
});

bot.onText(/\/start/, (msg) =>
{
    botStart(msg);
});
bot.onText(/\/stop/, (msg) =>
{
    stopGame(msg);
});
function botStart(msg) {
    bot.sendMessage(msg.chat.id, "Hello World!",
        {
            "reply_markup": {
                "keyboard": [
                    ["New Game"]
                ]
            }
        });
}

//Nuova partita
bot.onText(/New Game/, (msg) =>
{
    if(isGaming)
    {
        bot.sendMessage(msg.chat.id, "You must finish the current game before.");
        return;
    }
    newGame();
    bot.sendMessage(msg.chat.id, "We will now start a new game. Here's the table:\n\n" + tableMessage() + "\n\nPlayer1, Your Turn!", {
        reply_markup:
        {
            keyboard: forza4keyboard
        }
    });
});

//Esci dalla partita
bot.onText(/Exit Game/, (msg) =>
{
    bot.sendMessage(msg.chat.id, "Are you sure you want to quit?", 
    {
        reply_markup:
        {
            inline_keyboard: [[{
                text: "Yes",
                callback_data: "yes"
            }, {
                text: "No",
                callback_data: "no"
            }]]
        }
    });
    bot.on('callback_query', (example) =>
    {
        const action = example.data;
        const msg = example.message;
        if(action == "yes") stopGame(msg)
        else if(action == "no") bot.sendMessage(msg.chat.id, tableMessage());
    });
});

//Tasti delle colonne
bot.onText(/C0/, (msg) =>
{
    playerMove(msg, 0);
});
bot.onText(/C1/, (msg) =>
{
    playerMove(msg, 1);
});
bot.onText(/C2/, (msg) =>
{
    playerMove(msg, 2);
});
bot.onText(/C3/, (msg) =>
{
    playerMove(msg, 3);
});
bot.onText(/C4/, (msg) =>
{
    playerMove(msg, 4);
});
bot.onText(/C5/, (msg) =>
{
    playerMove(msg, 5);
});
bot.onText(/C6/, (msg) =>
{
    playerMove(msg, 6);
});

//A tasto premuto:
function playerMove(msg, column) 
{
    var isOk = insertCoin(column, player);
    if (isOk) 
    {
        if (check4(player)) 
        {
            var winner = "Player" + player;
            var query = "INSERT INTO games (chat_id, winner) VALUES ?";
            var data = [[msg.chat.id, winner]];
            connection.query(query, [data], (err) =>
            {
                if(err) throw err;
                console.log("Inserted");
            });
            bot.sendMessage(msg.chat.id, tableMessage() + "\n\n" + winner + ", You Win!\nDo you want to start a new game?",
                {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: "Yes",
                            callback_data: "new"
                        }, {
                            text: "No",
                            callback_data: "nonew"
                        }]]
                    }
                });
            bot.on('callback_query', (example) => 
            {
                const action = example.data;
                const msg = example.message;
                if (action == "new") 
                {
                    newGame();
                    bot.sendMessage(msg.chat.id, "We will now start a new game. Here's the table:\n\n" + tableMessage() + "\n\nPlayer1, Your Turn!", {
                        reply_markup: {
                            keyboard: forza4keyboard
                        }
                    });
                }
                else if (action == "nonew")
                    stopGame(msg);
            });
        }
        else
            bot.sendMessage(msg.chat.id, tableMessage() + "\n\nPlayer" + player + ", Your Turn!");

        if (player == 1)
            player = 2;
        else if (player == 2)
            player = 1;
    }
    else
        bot.sendMessage(msg.chat.id, "Cannot insert here, retry");
}

//Controlla che ci sia il 4
function check4(player)
{
    var win = false;
    for(var i = 5; i >= 0; i--)
    {
        for(var j = 6; j >= 0; j--)
        {
            //Obliquo
            if (table[i][j] == player && 
                table[i - 1][j - 1] == player && 
                table[i - 2][j - 2] == player && 
                table[i - 3][j - 3] == player)
            {
                win = true;
            }
            if (table[i][j] == player && 
                table[i - 1][j + 1] == player && 
                table[i - 2][j + 2] == player && 
                table[i - 3][j + 3] == player)
            {
                win = true;
            }
            //Orizzontale
            if (table[i][j] == player && 
                table[i][j - 1] == player && 
                table[i][j - 2] == player && 
                table[i][j - 3] == player)
            {
                win = true;
            }
            //Verticale
            if (table[i][j] == player && 
                table[i - 1][j] == player && 
                table[i - 2][j] == player && 
                table[i - 3][j] == player)
            {
                win = true;
            }
        }
    }
    return win;
}