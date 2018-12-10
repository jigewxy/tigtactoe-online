var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('underscore');

var o_player = [];
var x_player =[];
var count;
var client_arr =[];
var reset_vote ={};

app.use('/js', express.static(__dirname+'/js'));
app.use('/css', express.static(__dirname+'/css'));

app.get('/', (req, res)=>{

    res.sendFile(__dirname+'/index.html')

});


function resetParams(){

    o_player = [];
    x_player =[];
    count =0;
    reset_vote ={};

}

io.on('connection', (socket)=>{

        console.log(socket.client);
        var id = socket.client.id;


        if(client_arr.length<2 || client_arr.includes(id)==true )
        {
           if(client_arr.length<2)
                   client_arr.push(id);

            console.log(client_arr);

            socket.on('move', function(d){

                if(d.player =="o")
                        o_player.push({row:d.row, col:d.col})
                else if(d.player =="x")
                        x_player.push({row:d.row, col:d.col})
                
                count = d.count;
                
            socket.broadcast.emit('broadcast', {type: "message", data:d});
        
            })
        
            socket.on('disconnect', function(){
        
                console.log('a gamer disconnected');
                client_arr = _.without(client_arr, id);
                console.log(client_arr);

            })
        
            socket.on('o_won', function(){
        
                //reset
                resetParams();
            
                socket.broadcast.emit('broadcast', {type:"result", winner: "o"});
        
            })
        
            socket.on('x_won', function(){
        
                //reset
                resetParams();
            
                socket.broadcast.emit('broadcast', {type:"result", winner: "x"});
        
            })
            
            socket.on('draw', function(){
        
                //reset
                resetParams();
            
                socket.broadcast.emit('broadcast', {type:"result", winner: "none"});
        
            })

            socket.on('restart', function(){

                reset_vote[id] = true;

                let arr = Object.values(reset_vote);   //need both players agree to restart

                console.log(reset_vote);

                if(arr.length>=2 && arr.every((item)=>item==true))
                {
                    resetParams();
                    //socket.broadcast.emit('restart');
                    io.sockets.emit('restart');

                }
                
            })

        }

        else if(client_arr.length>=2 && client_arr.includes(id)==false)
        {
            socket.emit('drop', "two users in game already");
        }


});


http.listen(3000, function(){

    console.log('listening on port 3000');

})
