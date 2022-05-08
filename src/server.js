import express from 'express';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import session from "express-session";
import MongoStore from 'connect-mongo';
import { engine } from 'express-handlebars';
// import FileStore from "session-file-store"
import auth from "./middleware/middleware.js"
import "./config/db.js";
import { UsuariosModels } from "./modules/usuarios_modules.js";
// import redis from "redis"
// import RedisStore from "connect-redis"
dotenv.config();

// const fileStore = FileStore(session)

// const client = redis.createClient(
//     {legacyMode: true}
    // process.env.PORT_REDIS,
    // process.env.HOST_REDIS
// )
// client.connect()

// const redisStore = RedisStore(session)

const app = express();
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser(process.env.SECRET))

app.set("views", "./src/templates")
app.set("view engine", "hbs")

app.engine(
    "hbs",
    engine({
        extname: ".hbs",
        defaultLayout: "index.hbs",
        layoutsDir: "src/templates/layouts",
    }),
);

app.use(session({
    // store: new fileStore({
    //     path: "./sesiones",
    //         ttl:300,
    //         retries: 0,
    // }),
    // store: new redisStore({
    //     host: "localhost",
    //     port: 6379,
    //     client,
    //     ttl: 300,
    // }),
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        options: {
            userNewUrlParser:true,
            userUnifiedTopology:true}
    }),
    secret: process.env.SECRET,
    resave: true,
    saveUnility: true,
    // cookie: {maxAge:10000}
    rolling:true
}))

//-----------------------------------------------------------


async function createUser(data) {
    try {
        const response = await UsuariosModels.create(data)
        console.log(response);
    } catch (error) {
        console.log(error);
    }
}

async function readAll() {
    try {
        const response = await UsuariosModels.find()
        return response
    } catch (error) {
        console.log(error);
    }
}


//-----------------------------------------------------------

app.get("/registrar", (req, res) => {
    res.status(200).render("register", {log: req.session.login})
})

app.post("/registrar", (req, res) =>{
    const { body } = req;
    createUser(body)
    res.status(200).render("login", {})
})

app.get("/login", (req, res) => {
    res.status(200).render("login", {})
})


app.post("/login", async (req, res) =>{
    const { body } = req;
    try {
        let response = await readAll()
        let usuario
        
        for (const user of response) { 
            if (body.email === user.email && Number(body.password) === user.password) {
                console.log('CONECTACTOOOO');
                req.session.login = true
                usuario = user.usuario                
            }
        }

        if (req.session.login === true) {
            res.status(200).render("inicio", {user: usuario, log: req.session.login})
        } else {
            res.status(200).render("login", {})
        }
    
    } catch (error) {
        console.log(error);
    }
})


// app.get("/contador", (req, res) => {
//     if (req.session.contador) {
//         req.session.contador++;
//         res.send(`Has entrado tantas veces: ${req.session.contador}`)
//     } else {
//         req.session.contador = 1
//         res.send("Bienvenido!")
//     }
// })


app.get("/logout", (req, res, next) => {
    req.session.destroy((error) => {
        if (!error) {
            res.status(200).send("Salio de la aplicacion")
        } else {
            res.json(error)
        }
    })
})

app.get("/restringida", auth, (req, res) =>{
    res.send("Informacion restringida")
})

// -----------------------------------------------------

// coockie que no se borra

// app.get("/cookieIlimitada", (req,res, next) => {
//     res.cookie("ilimitada", "Esta es la data").send("Cookie ilimiada creada")
// })


// coockie que se borra con el maxAge
// app.get("/cookieLimitada", (req,res, next) => {
//     res.cookie("limitada", user, {maxAge: 30000}).send("Cookie limiada creada")
// })

// app.get("/leer", (req, res, next) => {
//     const cookie = req.cookies.ilimitada
//     res.json({cookie})
// })

// app.get("/borrar", (req, res, next) => {
//     res.clearCookie("ilimitada").send("Cockie ilimitada borrada")
// })

// cookie firmada, que no se puede editar
// app.get("/cookieFirmada", (req, res, next) =>{
//     user.firmada= "Cookie Firmada"
//     res.cookie("firmada", user, {maxAge:30000, signed:true}).send("Cookie Firmada")
// })


// app.get("/leerFirmada", (req, res, nect) =>{
//     const cookieFirmada = req.signedCookies.firmada
//     res.json({cookie: cookieFirmada})
// })


const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
console.log(`Servidor en el puerto http://localhost:${PORT}`)
});
server.on('error', (err) =>{console.log(err)}); 
