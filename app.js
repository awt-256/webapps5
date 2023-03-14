const express = require("express");
const logger = require("morgan");
const { auth, requiresAuth } = require('express-openid-connect');

const helmet = require("helmet");;
const db = require("./db/connection");

const PORT = process.env.PORT || 8080;

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'cdnjs.cloudflare.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com', 'fonts.googleapis.com'],
            fontSrc: ["'self'", 'fonts.gstatic.com']
        }
    }
}));

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

app.use(auth(config));
app.use((req, res, next) => {
    res.locals.isLoggedIn = req.oidc.isAuthenticated();
    res.locals.user = req.oidc.user;
    next();
})

app.use(logger("dev"));
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: false }));

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.get('/authtest', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

app.get("/", (req, res) => {
    res.render("index");
});

const dateISONow = () => new Date().toISOString();

app.get("/app", requiresAuth(), (req, res) => {
    db.readAll(req.oidc.user.email, (error, results) => {
        if (error) res.status(500).send(error);
        else {
            res.render("list", { items: results });
        }
    });
});

app.get("/app/item/:id", requiresAuth(), (req, res) => {
    db.read(req.oidc.user.email, req.params.id, (error, results) => {
        if (error) res.status(500).send(error);
        else {
            const item = results[0] || null;

            res.render("item", { item });
        }
    });
});

app.get("/app/item/:id/delete", requiresAuth(), (req, res) => {
    db.delete(req.oidc.user.email, req.params.id, (error, results) => {
        if (error) res.status(500).send(error);
        else {
            res.redirect("/app/")
        }
    });
});

const isLegalItemInfo = (name, description, quantity) => {
    if (typeof name !== "string" || name.length > 32) return false;
    if (typeof description !== "string" || name.length > 400) return false;
    if (!isFinite(quantity) || quantity < 0) return false;

    return true;
}

app.post("/app/item/new", requiresAuth(), (req, res) => {
    let { name, description, quantity } = req.body;
    quantity = parseInt(quantity);
    if (!isLegalItemInfo(name, description, quantity)) return res.status(400);
    const lastModified = dateISONow();
    db.insert(req.oidc.user.email, name, quantity, description, lastModified, (error, results) => {
        if (error) res.status(500).send(error);
        else {
            res.redirect("/app/");
        }
    })
});

app.post("/app/item/:id/update", requiresAuth(), (req, res) => {
    const id = req.params.id;
    let { name, description, quantity } = req.body;
    quantity = parseInt(quantity);
    if (!isLegalItemInfo(name, description, quantity)) return res.status(400);
    const lastModified = dateISONow();
    db.update(req.oidc.user.email, id, name, quantity, description, lastModified, (error, results) => {
        if (error) res.status(500).send(error);
        else {
            res.redirect("/app/item/" + id);
        }
    })
});

app.listen(PORT, () => {
    console.log(`App server listening on ${PORT}. (http://localhost:${PORT})`);
});