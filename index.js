const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));
app.use(express.json());

// 10 Live Active Dealers Database Configuration Memory Setup
let dealers = {};
for (let i = 1; i <= 10; i++) {
    let id = `Dealer_${i < 10 ? '0' + i : i}`;
    dealers[id] = { id: id, password: `pass${i}23`, points: 50000, commission: 0, isBlocked: false };
}

// Global Server Game Timer Loop State Manager Configuration
let gameState = {
    timer: 60,
    currentResult: null,
    adminOverrideMode: 'random', // max_bet, min_bet, force_black, force_white, random
    bets: { black: 0, white: 0 }
};

// 24/7 Running Sync Countdown Engine Logic Loop Array Setup
setInterval(() => {
    if (gameState.timer > 0) {
        gameState.timer--;
    } else {
        let winColor = 'black';
        let mode = gameState.adminOverrideMode;
        
        if (mode === 'min_bet') {
            winColor = gameState.bets.black <= gameState.bets.white ? 'black' : 'white';
        } else if (mode === 'max_bet') {
            winColor = gameState.bets.black >= gameState.bets.white ? 'black' : 'white';
        } else if (mode === 'force_black') {
            winColor = 'black';
        } else if (mode === 'force_white') {
            winColor = 'white';
        } else {
            winColor = Math.random() < 0.5 ? 'black' : 'white';
        }

        gameState.currentResult = winColor;
        io.emit('wheelSpin', { result: winColor });

        setTimeout(() => {
            gameState.timer = 60;
            gameState.bets = { black: 0, white: 0 };
            io.emit('gameReset', gameState);
        }, 5000);
    }
    io.emit('timerUpdate', { timer: gameState.timer, bets: gameState.bets });
}, 1000);

// Global API Central Endpoint Router Mapping Configuration Controls
app.post('/api/admin/control', (req, res) => {
    const { action, dealerId, value } = req.body;
    
    if (action === 'set_mode') {
        gameState.adminOverrideMode = value;
        return res.json({ success: true, adminOverrideMode: gameState.adminOverrideMode });
    }

    if (!dealers[dealerId]) return res.status(404).json({ success: false, message: "Dealer not found" });

    if (action === 'change_password') {
        dealers[dealerId].password = value;
        io.emit('dealerKickout', { dealerId });
    } else if (action === 'transfer_points') {
        dealers[dealerId].points += parseInt(value);
    } else if (action === 'clear_points') {
        dealers[dealerId].points = 0;
    } else if (action === 'toggle_block') {
        dealers[dealerId].isBlocked = !dealers[dealerId].isBlocked;
    }
    
    io.emit('dealerUpdate', dealers);
    res.json({ success: true, dealers, adminOverrideMode: gameState.adminOverrideMode });
});

// Production Port Binder Server Node Engine Mapping Hook
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Live Operational Node Server Listening on Port Configuration ${PORT}`);
});
