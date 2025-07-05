# Blocky Pew

Blocky Pew is a simple, multiplayer PvP bullet hell game built with the exceptional JavaScript runtime [Bun](https://bun.sh). Designed for quick and fun matches with friends, Blocky Pew was developed in just four days (outside of any game jam).

## Features

- Effortless LAN multiplayer using WebSockets
- Simple server-side configuration
- Fast performance (tested at 120 FPS with 5 players on modest hardware)
- Automatic map generation
- Optimized collision detection

## Controls

- Move: **WASD** keys
- Shoot: Click anywhere on the map to fire a bullet in that direction

## Game Modes

- **Elimination:** One round is played until only one player remains. The last player standing wins.
- **Mapclear:** The round continues until all walls are destroyed. The player with the fewest deaths wins.

## How to Join

Ask the server owner for the server address, then navigate to that URL in your browser.  
Alternatively, if you know the server owner's IP address, use `http://{IP}:6567` to join.

## Hosting a Blocky Pew LAN Server

1. **Install the Bun runtime (if you haven't already):**

   **Windows:**
   ```bash
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```

   **Linux:**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Clone this repository with git (or download and extract the ZIP):**
   ```bash
   git clone git@github.com:Kornelf4/blocky-pew.git
   ```

3. **Navigate to the project folder:**
   ```bash
   cd blocky-pew
   ```

4. **Start the server:**
   ```bash
   bun run index.js
   ```

5. *(Optional)* Configure game rules by editing the `gameRuleConfigFile`.  
   *(Note: The `targetFPS` setting currently has no effect.)*

6. The server will display its address in the console. Open this address in your browser to test the game. Share the address with friends you want to play with.

**Notes:**
- The server runs on port `6567` (the same as Mindustry). If the server is not reachable, check your firewall and antivirus settings.
- The server is optimized for LAN gameplay, but you can enable remote play by deploying with services like Coolify or by setting up port forwarding/tunneling (e.g., with [playit.gg](https://playit.gg)).  
  Please do not host the server publicly (e.g., on platforms like y8) without contacting the developer (me) first.

Have fun!
Can I have a star
---

If you encounter any errors, issues, or vulnerabilities, please open an issue in this repository.