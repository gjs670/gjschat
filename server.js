let express = require("express");
let app = express();
let http = require("http");
let server = http.Server(app);
let io = require("socket.io")(server); //引入socket.io模块并绑定到服务器
let ipv4 = "192.168.1.116";
let path = require("path");
let publicPath = `${__dirname}/public/`;
let mysql = require("mysql");


//连接数据库
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'test'
});

//开始连接
connection.connect();

// 静态资源引入
app.use(express.static('public'));

// 访问http://192.168.1.116/8080/ 将html文件发送过去
app.get("/", (req, res) => {
    res.sendFile(`${publicPath}html/gjschat.html`);
});

server.listen(8080, ipv4);

io.on("connection", (socket) => {
    console.log('和客户端建立连接' + socket.id)
    socket.on("login", (data) => {
        let selectUser = "SELECT * FROM `gjs` WHERE name = " + JSON.stringify(data.user);
        connection.query(selectUser, (err, result) => {
            let resData = {};
            if (!err) {
                if (result.length) {
                    if (result[0].password == data.psw) {
                        console.log("用户" + data.user + "已登录");
                        resData.error = 1;
                        resData.notice = "登录成功";
                    } else {
                        console.log("用户" + data.user + "密码错误");
                        resData.error = 0;
                        resData.notice = "密码错误";
                    }
                } else {
                    console.log("用户" + data.user + "不存在");
                    resData.error = 0;
                    resData.notice = "该用户不存在";
                }
            } else {
                resData.error = 0;
                resData.notice = err;
            }
            socket.emit("checkLogin", resData)
        })
    });

    socket.on("register", (data) => {
        let selectUser = "SELECT * FROM `gjs` WHERE name = " + JSON.stringify(data.user);
        connection.query(selectUser, (err, result) => {
            let resData = {};
            if (!err) {
                if (result.length) {
                    console.log("用户" + data.user + "已存在");
                    resData.error = 0;
                    resData.notice = "用户已存在";
                    socket.emit("checkRegister", resData)
                } else {
                    let add = "INSERT INTO gjs(id,name,password) VALUE(0,?,?)";
                    let addPamas = [JSON.stringify(data.user), JSON.stringify(data.psw)];
                    connection.query(add, addPamas, (err, result) => {
                        if(!err){
                            console.log("用户" + data.user + "注册成功");
                            resData.error = 1;
                            resData.notice = "注册成功";
                        }else{
                            console.log(err);
                            resData.error = 0;
                            resData.notice = "注册失败";
                        }
                        socket.emit("checkRegister", resData)
                    })
                }
            } else {
                resData.error = 0;
                resData.notice = err;
                socket.emit("checkRegister", resData)
            }
           
        })
    })
})