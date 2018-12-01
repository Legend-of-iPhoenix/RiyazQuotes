function login() {
	var email = document.getElementById("email");
	var password = document.getElementById("password");
	firebase.auth().signInWithEmailAndPassword(email.value, password.value).catch(function (error) {
		var errorCode = error.code;
		var errorMessage = error.message;
		if (errorCode == "auth/wrong-password" || errorCode == "auth/user-not-found") {
			document.getElementById("errors").innerHTML = "Incorrect email or password.";
		} else {
			document.getElementById("errors").innerHTML = errorMessage;
		}
	});
}

var started = false;
var quotes = [];
var originalQuotes = [];

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
firebase.auth().onAuthStateChanged(function(user) {
	if (user && !started) {
		started = true;
		document.getElementById("login").style.display = "none";
		document.getElementById("edit").style.display = "block";
		console.log("started");
		firebase.database().ref("/quotes/").once('value').then(function(snapshot) {
			var data = snapshot.val();
			quotes = data.map(x=>x);
			originalQuotes = data.map(x=>x);
			showQuotes(data);
		});
	}
});

function showQuotes(data) {
	document.getElementById('quotes').innerHTML = data.map((quote, i)=>quote?'<li id="quote_container_'+i+'"><input type="button" id="delete_'+i+'" onclick="deleteQuote('+i+')" class="deleteQuote" value="x"><input type="text" id="quote_' + i + '" oninput="editQuote('+i+')"></li>' : '').join('\n');

	data.map((quote, i) => {
		document.getElementById("quote_"+i).value = quote.replace(/\n/g, '\\n');
	})
}

function save() {
	firebase.database().ref("/quotes/").set(quotes).then(function() {
		firebase.database().ref("/numQuotes/").set(quotes.length - 1).then(function() {
			originalQuotes = quotes.map(x=>x);
			showQuotes(quotes);
			calculateChanges();
		})
	});
}

function addQuote() {
	var text = document.getElementById('new');
	quotes.push(text.value);
	text.value = "";
	showQuotes(quotes);
	calculateChanges();
}

function deleteQuote(i) {
	quotes.splice(i, 1);
	document.getElementById('quote_container_'+i).remove();
	calculateChanges();
}

function editQuote(i) {
	var text = document.getElementById('quote_'+i).value;
	if (text == '') {
		document.getElementById('delete_'+i).classList.add("visible");
	} else {
		document.getElementById('delete_'+i).classList.remove("visible")
	}
	quotes[i] = text;
	calculateChanges();
}

function logout() {
	var changes = calculateChanges()
	if (changes) {
		if (confirm("You have " + changes + " unsaved change" + (changes!=1?'s':'') + '. These will be lost if you log out. \n\nContinue logout?')) {
			firebase.auth().signOut().then(function() {
				location.reload();
			});
		}
	} else {
		firebase.auth().signOut().then(function() {
			location.reload();
		});
	}
}

function calculateChanges() {
	var changes = levenshtein(JSON.stringify(quotes), JSON.stringify(originalQuotes));
	document.getElementById('changes').innerText = changes;
	document.getElementById('s').innerText = changes!=1?'s':'';
	return changes
}

// from https://stackoverflow.com/a/35279162
function levenshtein(r,e){if(r===e){return 0}var t=r.length,n=e.length;if(0===t||0===n){return t+n}var a,o,h,f,A,c,d,i=0,C=new Uint16Array(t),v=new Uint32Array(t);for(a=0;a<t;){v[a]=r.charCodeAt(a),C[a]=++a}for(;i+3<n;i+=4){var u=e.charCodeAt(i),l=e.charCodeAt(i+1),g=e.charCodeAt(i+2),w=e.charCodeAt(i+3);for(f=i,h=i+1,A=i+2,c=i+3,d=i+4,a=0;a<t;a++){(o=C[a])<f||h<f?f=o>h?h+1:o+1:u!==v[a]&&f++,f<h||A<h?h=f>A?A+1:f+1:l!==v[a]&&h++,h<A||c<A?A=h>c?c+1:h+1:g!==v[a]&&A++,A<c||d<c?c=A>d?d+1:A+1:w!==v[a]&&c++,C[a]=d=c,c=A,A=h,h=f,f=o}}for(;i<n;){var y=e.charCodeAt(i);for(f=i,A=++i,a=0;a<t;a++){A=(o=C[a])<f||A<f?o>A?A+1:o+1:y!==v[a]?f+1:f,C[a]=A,f=o}d=A}return d}