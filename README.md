# Metro-DiscordBot
# DayZ Admin Bot

## Self Hosting

- Create a new folder and upload the code to that folder (https://docs.digitalocean.com/products/droplets/how-to/transfer-files/)
- SSH into your server (https://www.vultr.com/docs/how-to-connect-to-a-linux-cloud-server-from-your-windows-desktop/)
- Change your directory (folder) to where you uploaded the files (`cd /path/to/bot/code`)
- Install Node.js and Npm 
- - `curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh`
- - `sudo bash /tmp/nodesource_setup.sh`
- - `sudo apt install nodejs`
- Install pm2 (`npm install pm2@latest -g`)
- Install node modules (`npm install`)
- Start the bot (`pm2 start src/index.js --name dayz-bot`)

Optional: Make bot auto restart on system reboot
- `pm2 startup` (Copy and run the command it gives you)
- `pm2 save`
