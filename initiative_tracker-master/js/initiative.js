var version = "Version 1.3.1 by Jason Weatherly";
var title = "Initiative Tracker";
var db = window.openDatabase("UsersDB", "", "UserTable", 1024*1000);
var round = 0;
var current_player = 0;
var is_started = false;
var no_players = true;
/* For the player tracker */
var createStatement = "CREATE TABLE IF NOT EXISTS Characters (id INTEGER PRIMARY KEY AUTOINCREMENT, player_name TEXT, initiative INTEGER, bonus INTEGER, dexterity INTEGER, type TEXT)";
var clearPlayers = "DROP TABLE Characters";
var clearEffects = "DROP TABLE Effects";
var selectAllStatement = "SELECT * FROM Characters ORDER BY initiative DESC, bonus DESC, dexterity DESC";
var insertStatement = "INSERT INTO Characters (player_name, initiative, bonus, dexterity, type) VALUES (?, ?, ?, ?, ?)";
var deleteStatement = "DELETE FROM Characters WHERE player_name=?";

/* For the effect tracker */
var createEffectTable = "CREATE TABLE IF NOT EXISTS Effects (id INTEGER PRIMARY KEY AUTOINCREMENT, player_name TEXT, round INT, short TEXT, description TEXT, type TEXT)";
var insertEffect = "INSERT INTO Effects (player_name, round, short, description, type) VALUES (?, ?, ?, ?, ?)"; 
var selectAllEffects = "SELECT * FROM Effects ORDER BY round ASC, short ASC";
var deleteEffect = "DELETE FROM Effects WHERE id=?";

createTable();
refreshView();

$('div.round').hide();
$('div.triggers').hide();

$('#submit_new_player').click( function() {
    console.log("Adding player to local DB.");
    addCharacter();
    $('form[name="addCharacter"]').find("input").val("");
    });

$('#submit_new_effect').click( function() {
    console.log("Adding effect to local DB.");
    addEffect();
    $('form[name="addEffect"]').find("input").val("");
    });

function nullDataHandler(transaction, results) { }

function createTable() {
    db.transaction(function (tx) {
        tx.executeSql(createStatement);
    });
	db.transaction(function (tx) {
		tx.executeSql(createEffectTable);
	});
}

function clearTables() {
    db.transaction(function (tx) {
        tx.executeSql(clearPlayers);
    });
    db.transaction(function (tx) {
        tx.executeSql(clearEffects);
    });
}

function addEffect() {
	var player_name, round, short, description, type;
	var fields = $('form[name="addEffect"]').serializeArray();
	$.each(fields, function(i, fd){
		if(fd.name === "player_name") player_name = fd.value;
		if(fd.name === "effect_name") short = fd.value;
		if(fd.name === "round") round = fd.value;
		if(fd.name === "description") description = fd.value;
        if(fd.name === "whose_character") type = fd.value;
        console.log("fd.name: " + fd.name + " [" + fd.value + "]");
	});
	if (!player_name || !round || !short || !description) {
		console.log("Missing a field, try again.");
		alert("You're missing a field, try again.");
		return;
	}
	db.transaction(function (tx) {
		tx.executeSql(insertEffect,
			[player_name, round, short, description, type]);
	});
	refreshView();
}

function addCharacter() {
    var player_name, initiative, bonus, dexterity, type;
    var fields = $('form[name="addCharacter"]').serializeArray();
    $.each( fields, function(i, fd) {
        if(fd.name === "init_roll") initiative = fd.value;
        if(fd.name === "character_name") player_name = fd.value;
        if(fd.name === "initiative_bonus") bonus = fd.value;
        if(fd.name === "dexterity") dexterity = fd.value;
        if(fd.name === "whose_character") type = fd.value;
    });
    if (!initiative || !player_name || !bonus || !dexterity) {
        console.log("Missing a field, try again.");
        alert("You're missing a field, try again.");
        return;
    }
    db.transaction(function (tx) {
        tx.executeSql(insertStatement,
            [player_name, initiative, bonus, dexterity, type]);
    });
    refreshView();
}

function refreshView() {
    db.transaction( function(tx) {
        tx.executeSql(selectAllStatement, [], dataHandler, errorHandler);
		tx.executeSql(selectAllEffects, [], dataHandlerEffects, errorHandler);
    });
    if (is_started) updatePlayer();
}

function errorHandler(transaction, error) {
    alert('Oops.  Error was '+error.message+' (Code '+error.code+')');
    var we_think_this_error_is_fatal = true;
    if (we_think_this_error_is_fatal) return true;
    return false;
}

function dataHandler(transaction, results) {
    var final_string = "";
    var source = $("#player-template").html();
    var template = Handlebars.compile(source);
    
    if (results.rows.length === 0) {
        final_string = '<div class="no_results">Feel free to add players to the initiative tracker.</div>';
        $('div.players').html(final_string); 
        $('#start').prop('disabled', true);
        no_players = true;
    }
    else {
        for (var i=0; i<results.rows.length; i++) {
            var row = results.rows.item(i);
            typelabel = ((row['type'] === 'pc') ? 'PC' : 'NPC');
            var context = {roll: row['initiative'], name: row['player_name'], 
                            id: i+1, type: row['type'], label: typelabel};
            final_string = final_string + template(context); 
        }
        $('div.players').html(final_string);
        $('#start').prop('disabled', false);
        no_players = false;
    }    
    addDeleteClickEvent();
}

/* var insertEffectTable = "INSERT INTO Effects (player_name, round, short, description, type) VALUES (?, ?, ?, ?, ?)"; */
function dataHandlerEffects(transaction, results) {
	var final_content = "";
	var source = $("#effect-template").html();
	var template = Handlebars.compile(source);
	
	if (results.rows.length >= 0) {
		for (var i=0; i<results.rows.length; i++) {
			var row = results.rows.item(i);
            delay_class = ((row['round'] >= round ) ? 'delay' : 'delay inactive');
            console.log(delay_class + "|" + round);
			typelabel = ((row['type'] === 'pc') ? 'pc' : 'npc');
            var context = {
                round: row["round"],
                source: row["player_name"],
                description: row["description"],
                effect: row["short"],
                type: typelabel,
                delay: delay_class,
                id: row['id']
            };
            final_content = final_content + template(context);                       
		}
        $('div.triggers').html(final_content);
        updatePlayer();
	}
    addDeleteEffectEvent();
}

function addOnClickEvent() {
    $('div').on('mouseenter', 'div.player', function(){
        $('div').removeClass("selected");
        $(this).addClass("selected");
    });
}

function addDeleteClickEvent() {
    $('div').on('mouseenter', 'div.is_icon', function(){
        $(this).addClass("highlight_icon");
    });
    $('div').on('mouseleave', 'div.is_icon', function() {
        $(this).removeClass("highlight_icon");
    });
    $('div').on('click', 'div.remove', function(){
        character = $(this).attr('id');
        db.transaction(function(tx) {
            tx.executeSql(deleteStatement, [character]);
        });
        refreshView();
    });
}

function addDeleteEffectEvent() {
    $('div').on('mouseenter', 'div.is_icon', function(){
        $(this).addClass("highlight_icon");
    });
    $('div').on('mouseleave', 'div.is_icon', function() {
        $(this).removeClass("highlight_icon");
    });
    $('div').on('click', 'div.remove_effect', function() {
        id = $(this).attr('effect');
        db.transaction(function(tx) {
            tx.executeSql(deleteEffect, [id]);
        });
        refreshView();
    });
}

$('#start').click(function(){
    startRounds();
});

$('#next_button').click(function(){
    nextPlayer();
});

// The Hotkey part
$(document).keypress(function(e){
    if ($('form[name="addCharacter"]').is(':visible')) return;
    if ($('form[name="addEffect"]').is(':visible')) return;
    switch(e.which) {
        case 110: // Letter 'n'
        case 32: // Spacebar
            nextPlayer();
            break;
        case 112: // Letter 'p'
            prevPlayer();
            break;
        case 115: // Letter 's'
            startRounds();
            break;
        case 104: // Letter 'h'
            resetPlayer();
            break;
        case 78:  // Letter 'N'
            $('#myModal').modal('show');
            break;
        case 126:
            clearTables();
            createTable();
            resetPlayer();
            refreshView();
            break;
    }
});

$('#prev_button').click(function(){
    prevPlayer();
});

$('#reset_button').click(function(){
    resetPlayer();
});

$('button[name="about"]').popover({
    content: version,
    placement: 'bottom',
    container: 'body',
    title: title
});

function startRounds() {
    if (no_players) return; 
    is_started = true;
    $('button.add-effect-btn').prop('disabled', false);
    current_player = 1;
    $('.player').first().addClass('selected');
    round = 1;
    $('#round_text').text(round);
    $('div.round').show();
    $('div.triggers').show();
}

function nextPlayer() {
    if (is_started) {
        if (current_player >= $('.player').length) {
            current_player = 1;
            round = round + 1;
        } else {
            current_player++;
        }
        updatePlayer();
        updateEffects();
    }
}

function prevPlayer() {
    if (is_started) {
        if (current_player <= 1) {
            current_player = $('.player').length;
            round--;
        } else {
            current_player--;
        }
        updatePlayer();
        updateEffects();
    }
}

function updateEffects() {
    $(".triggers .delay").each(function(i) {
        if ($( this ).find(".round").text() < round) {
            $( this ).addClass( "inactive" );
        }
        else {
            $( this ).removeClass( "inactive" );
        }
    });
}

function resetPlayer(){
    $('.player').removeClass('selected');
    round = 0;
    current_player = 0;
    is_started = false;
    $('#round_text').text(round);
    $('div.round').hide();
    $('div.triggers').hide();
    $('button.add-effect-btn').prop('disabled', true);
}

function updatePlayer(){
    $('.player').removeClass('selected');
    $('#player'+current_player).addClass('selected');
    $('#round_text').text(round);
}
