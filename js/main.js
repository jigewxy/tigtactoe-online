// JavaScript Document
$(document).ready(function () {

  var x = "x"
  var o = "o"
  var count = 0;
  var o_win = 0;
  var x_win = 0;
  var o_arr = [];
  var x_arr = [];
  var base_number = 3; //start with 3
  var base = []; //[1,2,3]
  var base_r = []; //[3,2,1]
  //coordinates for the two diagnals
  var diag_ns = []; //["11", "22", "33"] 
  var diag_sn = []; //["31", "22", "13"]
  var player_turn = "x";
  var socket = io();

  var overlayMsg = {

    show: (msg) => {

      $('#game').hide();
      $('#overlayText').html(msg);
      $('#overlayPad').css('display', 'flex');
      if (window.navigator.vibrate !== undefined)
        window.navigator.vibrate(200);
    },

    hide: () => {

      $('#overlayPad').hide();
      $('#overlayText').html('');
      $('#game').css('display', 'flex');

    }


  }


  initialization();

  $('#gameScale').on('change', function (event) {

    var size = parseInt($(this).val());

    base_number = size; //change the base number;

    setGamePad(size);
    initialization(); // reinitialze the game parameters;
    hardReset();

  })


  $('#themeChanger').click(function () {

    if ($(this).hasClass('dark--theme')) {
      less.modifyVars({
        '@mainBgColor': 'rgba(4, 4, 4, 0.7)'
      }); // change the mainBgColor
      $(this).addClass('fa-sun light--theme').removeClass('fa-cloud-moon dark--theme').attr('title', 'Light Theme');
    } else if ($(this).hasClass('light--theme')) {
      less.modifyVars({
        '@mainBgColor': '#eee'
      }); // change the mainBgColor
      $(this).addClass('fa-cloud-moon dark--theme').removeClass('fa-sun light--theme').attr('title', 'Dark Theme');
    }


  });


  $("#reset").click(function () {

    socket.emit('restart');
    $(this).text('Requested to Restart...')

  });


  socket.on('drop', function (msg) {

    $('#statusText').html('<red>Two Users in the game already,  Please wait! </red>');
    socket.close();

  })

  socket.on('restart', function () {

    console.log('retart message received');

    softReset();

  });


  socket.on('broadcast', function (d) {

    if (d.type == "message")
      drawOpponentMove(d.data);

    else if (d.type == "result") {

      if (d.winner == "x") {
        overlayMsg.show("<span style='color:khaki'>X</span> Wins!");
        x_win++;
        $('#xScore').text(x_win);
        $('#statusText').html('Game Over, <b>X</b> Wins!');

      } else if (d.winner == "o") {
        overlayMsg.show("<span style='color:khaki'>X</span> Wins!");
        x_win++;
        $('#xScore').text(x_win);
        $('#statusText').html('Game Over, <b>X</b> Wins!');

      } else if (d.winner == "none") {
        $('#statusText').html('Game Over, <b>OX</b> Draws!')
        overlayMsg.show("<span style='color:white'>O</span><span style='color:khaki'>X</span> Draw!");

      }

    }

  })




  function drawOpponentMove(d) {

    count = d.count;
    $(`li[data-column=${d.col}][data-row=${d.row}]`).text(d.player).addClass(`disable ${d.player}`);

    //switch player here
    player_turn = d.player == "x" ? "o" : "x";

    console.log("now your turn --", player_turn);
    $('#statusText').html(`Now your turn! <b>${player_turn.toUpperCase()} Player</b>`);
    $(`#${player_turn}_win`).removeClass('active').siblings().addClass('active');

  }



  function bindGamePadClick() {


    $('#game li').click(function () {

      if ($(this).hasClass('disable')) {

        if (window.navigator.vibrate !== undefined)
          window.navigator.vibrate(200);

        $(this).addClass('alert');

        setTimeout(() => $(this).removeClass('alert'), 200);

        //  alert('Slot already selected');
      } else {

        //get col, row  data matrix

        if (count % 2 == 0) {

          if (player_turn == "o") {
            if (window.navigator.vibrate !== undefined)
              window.navigator.vibrate(200);

            $(this).addClass('alert');

            setTimeout(() => $(this).removeClass('alert'), 200);

          } else {

            count++;
            $(this).text(x).addClass('disable x');
            var d = $(this).data();

            x_arr.push(d);
            let cols = _.pluck(x_arr, 'row');
            let rows = _.pluck(x_arr, 'column');

            $('#statusText').html(`Wait for Opponent...`);
            socket.emit('move', {

              player: 'x',
              count: count,
              row: d.row,
              col: d.column

            });

            if (cols.length < base_number)
              return; //nothing to check if it doesn't need the minimum winner requirement

            else {

              //check if anyone wins
              if (checkHorizontalVertical(cols) == true || checkHorizontalVertical(rows) == true || checkDiagonals(cols, rows) == true) {
                overlayMsg.show("<span style='color:khaki'>X</span> Wins!");
                x_win++;
                $('#xScore').text(x_win);
                $('#statusText').html('Game Over, <b>X</b> Wins!');
                socket.emit('x_won');
              }
              // if no one wins, check if game draws
              else if (count >= (Math.pow(base_number, 2))) {

                $('#statusText').html('Game Over, <b>OX</b> Draws!')
                overlayMsg.show("<span style='color:white'>O</span><span style='color:khaki'>X</span> Draw!");
                socket.emit('draw');

              }




            }
          }
        } else {


          if (player_turn == "x") {
            if (window.navigator.vibrate !== undefined)
              window.navigator.vibrate(200);

            $(this).addClass('alert');

            setTimeout(() => $(this).removeClass('alert'), 200);

          } else {

            count++;

            $(this).text(o).addClass('disable o');
            var d = $(this).data();
            o_arr.push(d);

            let cols = _.pluck(o_arr, 'row');
            let rows = _.pluck(o_arr, 'column');

            $('#statusText').html(`Wait for Opponent...`);

            socket.emit('move', {

              player: 'o',
              count: count,
              row: d.row,
              col: d.column

            });

            console.log(cols, rows);


            if (cols.length < base_number) //no need to check winner if count number < base_number
              return;
            else {

              if (checkHorizontalVertical(cols) == true || checkHorizontalVertical(rows) == true || checkDiagonals(cols, rows) == true) {

                overlayMsg.show("<span style='color:khaki'>O</span> Wins!");
                o_win++;
                $('#oScore').text(o_win);
                $('#statusText').html('Game Over, <b>O</b> wins!')
                socket.emit('o_won');

              } else if (count >= (Math.pow(base_number, 2))) {
                softReset();
                overlayMsg.show("<span style='color:white'>O</span><span style='color:khaki'>X</span> Draw!");
                socket.emit('draw');

              }
            }


          }

        }
      }


    });


  }



  function initialization() {


    initConstantArray(); //initialze constant array for winner check use
    setGamePad(base_number); //Initialize game pad
    bindGamePadClick(); // bind the gamepad button clicks

  }


  function initConstantArray() {

    diag_ns = []; // reset diagnal array
    diag_sn = [];

    base = _.range(1, base_number + 1);
    base_r = base.slice().reverse();

    _.zip(base, base).forEach((item) => {

      diag_ns.push(item.join(''));

    })

    _.zip(base_r, base).forEach((item) => {

      diag_sn.push(item.join(''));

    })

  }


  function checkHorizontalVertical(d) {

    //find the largest count of repeated row or column, check if it is greater than the base size.
    //ex: check if it takes all 3 numbers in a single row or column for 3x size

    let temp = Object.values(_.countBy(d)); //get counts of different rows

    if (temp.sort((a, b) => (b - a))[0] >= base.length) //sort by reverse order
      return true;
    else
      return false;

  }

  function checkDiagonals(cols, rows) {

    let matrix = [];

    _.zip(cols, rows).forEach(item => {

      matrix.push(item.join(''));

    });

    console.log(matrix);

    //if it contains all points on either of diagnals: ["11", "22", "33"] or ["31", "22", "13"], return true
    if (diag_ns.every(item => matrix.includes(item)) == true || diag_sn.every(item => matrix.includes(item)) == true)
      return true;
    else
      return false;

    //console.log(cols, rows);


  }

  function softReset() {

    count = 0;
    o_arr = [];
    x_arr = [];
    overlayMsg.hide();
    $("#game li").text("").removeClass('disable o x');
    $('#statusText').html('<b>X</b> \'s Turn');
    $('#reset').text('Restart')

  }

  function hardReset() {

    softReset();
    o_win = 0;
    x_win = 0;
    $('#oScore').text('-');
    $('#xScore').text('-');

  }

  function setGamePad(size) {


    var ratio = Math.floor(100 / size);
    var fontSize = (36 / size).toFixed(2) + 'rem';
    var elems = document.getElementById('game');

    elems.innerHTML = '';

    for (var i = 1; i <= size; i++) {

      for (var j = 1; j <= size; j++) {

        var item = document.createElement('li');

        item.setAttribute('class', 'btn btn-game');
        item.setAttribute('data-row', i);
        item.setAttribute('data-column', j);
        item.setAttribute('style', `width:${ratio}%;height:${ratio}%;font-size:${fontSize}`);
        item.innerHTML = '';
        elems.appendChild(item);

      }

    }

  }



});