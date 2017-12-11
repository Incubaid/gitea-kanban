### Running Kanban in production

* You will need to build the kanban to be able to run it in production:
```bash
npm run build
``` 

If build succeeded, the new built files will be located in `/dist` directory. You can copy it into any web server root directory and serve it. i.e(`/var/www/html`)


### Example for serving kanban using Caddy web server
* Create Caddyfile inside `gitea-kanban` directory
```
http://localhost:8000 {
    bind  0.0.0.0
    root  dist
}
```

* Run caddy:
```bash
caddy
```
