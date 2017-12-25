### Running Kanban:
* Install node.js 
```bash
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs
```

* Clone the repo and install npm libraries
```bash
git clone https://github.com/Incubaid/gitea-kanban.git
cd gitea-kanban
npm install
```

* Edit `/src/http-common.js` and set `baseUrl` to your gitea server url you want to connect kanban to.
```
baseURL: 'http://localhost:3000/api/v1/',
```

* Run the development server:
```bash
npm start
``` 

You will be able to access the kanban through `http://localhost:8080`
