window.onload = function() {
    document.querySelector(".down").addEventListener("click", openInput);
    document.querySelector(".inputDivOuther").addEventListener("click", closeInput);
    document.querySelector(".button").addEventListener("click", submit);
}

function closeInput() {
    document.getElementById("cover").style.background = "rgba(0,0,0,0)";
    document.querySelector(".inputDiv").style.top = "-230px";
    setTimeout(function() {
        document.getElementById('cover').style.display = "none";
        document.querySelector(".down").style.display = "block";
    }, 201);
}

function submit() {
    var val = document.querySelector("input").value;
    document.getElementById("frame").src = val;
    closeInput();
}

function openInput() {
    document.getElementById('cover').style.display = "block";
    document.querySelector(".down").style.display = "none";
    setTimeout(function() {
        document.getElementById("cover").style.background = "rgba(0,0,0,.4)";
        document.querySelector(".inputDiv").style.top = "0px";
    }, 10);
}
