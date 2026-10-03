const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.WEB_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "web")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "web", "index.html"));
});

app.get("/login", (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        response_type: "code",
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        scope: "identify"
    });

    res.redirect(
        `https://discord.com/oauth2/authorize?${params.toString()}`
    );
});

app.get("/auth/discord", async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Código de autenticación faltante.");
    }

    try {
        const response = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI
            })
        });

        const token = await response.json();

        if (!token.access_token) {
            return res.status(401).send("No se pudo iniciar sesión con Discord.");
        }

        const userResponse = await fetch(
            "https://discord.com/api/users/@me",
            {
                headers: {
                    Authorization: `Bearer ${token.access_token}`
                }
            }
        );

        const user = await userResponse.json();

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                global_name: user.global_name,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error("Error OAuth2:", error);

        res.status(500).send(
            "Ocurrió un error al iniciar sesión."
        );
    }
});

app.get("/health", (req, res) => {
    res.json({
        status: "online",
        service: "Milo IA"
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Web de Milo activa en el puerto ${PORT}`);
});
